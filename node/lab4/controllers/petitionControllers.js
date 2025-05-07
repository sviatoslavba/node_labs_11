const db = require('../db');

const statusMap = {
    "rejected": "Відхилено",
    "accepted": "Прийнято",
    "on-review": "На розгляді",
    "expired": "Термін вийшов"
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };
exports.changePetStatus = async function() {
    const now = new Date();
    const random = Math.floor(Math.random() * 3);
    const statuses = ['rejected', 'accepted', 'on-review', 'expired', "In_Progress"];

    try {
        // Get all in-progress petitions
        const [petitions] = await db.query(
            'SELECT * FROM petitions WHERE status = "In_Progress"'
        );

        for (const petition of petitions) {
            let newStatus = "In_Progress";
            
            if (petition.petition_current >= 25000) {
                newStatus = statuses[random];
            } else if (new Date(petition.expiry_date) < now) {
                newStatus = "expired";
            }

            if (newStatus !== "In_Progress") {
                await db.query(
                    'UPDATE petitions SET status = ? WHERE id = ?',
                    [newStatus, petition.id]
                );
            }
        }
    } catch (err) {
        console.error("Error updating petition statuses:", err);
    }
}

exports.getPetitions = async (req, res) => {
    try {
        const [activePetitions] = await db.query(`
            SELECT p.*, a.username as author_username 
            FROM petitions p
            JOIN authors a ON p.author_id = a.id
            WHERE p.status = "In_Progress"
        `);
        
        const formattedPetitions = activePetitions.map(petition => ({
            ...petition,
            creation_date: formatDate(petition.creation_date),
            expiry_date: formatDate(petition.expiry_date)
        }));

        res.render('index', { petitions: formattedPetitions });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
}

exports.getPetitionCreationPage = (req, res) => {
    res.render('create-petition');
}

exports.getPetitionOverview = async (req, res) => {
    const petitionId = req.params.id;
    
    try {
        const [petitions] = await db.query(`
            SELECT p.*, a.username as author_username 
            FROM petitions p
            JOIN authors a ON p.author_id = a.id
            WHERE p.id = ?
        `, [petitionId]);
        
        if (petitions.length === 0) {
            return res.status(404).send("Петиція не знайдена");
        }

        const petition = petitions[0];
        res.render('view-petition', {
            id: petition.id,
            title: petition.title,
            text: petition.text,
            author_username: petition.author_username,
            petition_current: petition.petition_current,
            expiry_date: formatDate(petition.expiry_date) // Форматуємо дату
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
}

exports.petitionVoting = async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    
    const userId = req.session.user.id;
    const petitionId = req.params.id * 1;

    try {
        // Check if user already voted
        const [existingSignatures] = await db.query(
            'SELECT * FROM signatures WHERE author_id = ? AND petition_id = ?',
            [userId, petitionId]
        );
        
        if (existingSignatures.length > 0) {
            return res.status(400).json({ message: "Ви вже голосували за цю петицію" });
        }

        // Start transaction
        await db.query('START TRANSACTION');

        // Add signature
        await db.query(
            'INSERT INTO signatures (author_id, petition_id) VALUES (?, ?)',
            [userId, petitionId]
        );

        // Update petition count
        await db.query(
            'UPDATE petitions SET petition_current = petition_current + 1 WHERE id = ?',
            [petitionId]
        );

        // Commit transaction
        await db.query('COMMIT');

        // Get updated petition count
        const [updatedPetitions] = await db.query(
            'SELECT petition_current FROM petitions WHERE id = ?',
            [petitionId]
        );

        return res.status(200).json({
            message: "Голос зараховано",
            petition_current: updatedPetitions[0].petition_current
        });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        return res.status(500).json({ message: "Помилка сервера" });
    }
}

exports.getCompletedPetitions = async (req, res) => {
    try {
        const [completedPetitions] = await db.query(`
            SELECT p.*, a.username as author_username 
            FROM petitions p
            JOIN authors a ON p.author_id = a.id
            WHERE p.status != "In_Progress"
        `);
        
        const formattedPetitions = completedPetitions.map(petition => ({
            ...petition,
            creation_date: formatDate(petition.creation_date),
            expiry_date: formatDate(petition.expiry_date)
        }));

        res.render("completed-petitions", {
            petitions: formattedPetitions,
            statusMap
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
}

exports.getMyPetitions = async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    
    const sessionId = req.session.user.id;
    
    try {
        const [usersPetitions] = await db.query(`
            SELECT p.*, a.username as author_username 
            FROM petitions p
            JOIN authors a ON p.author_id = a.id
            WHERE p.author_id = ?
        `, [sessionId]);
        
        const formattedPetitions = usersPetitions.map(petition => ({
            ...petition,
            creation_date: formatDate(petition.creation_date),
            expiry_date: formatDate(petition.expiry_date)
        }));

        res.render("my-petitions", {
            usersPetitions: formattedPetitions
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка сервера");
    }
}

exports.petitionCreation = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send({
            message: "Авторизуйтеся для створення петиції"
        });
    }

    const { title, text } = req.body;
    if (!title || !text) {
        return res.redirect("/login");
    }

    const author_id = req.session.user.id;
    const creation_date = new Date();
    const expiry_date = new Date();
    expiry_date.setMonth(creation_date.getMonth() + 1);

    try {
        const [result] = await db.query(
            `INSERT INTO petitions 
            (author_id, title, text, creation_date, expiry_date, status) 
            VALUES (?, ?, ?, ?, ?, "In_Progress")`,
            [author_id, title, text, creation_date, expiry_date]
        );
        
        res.status(200).json({
            status: 'success',
            data: {
                petition: {
                    id: result.insertId,
                    author_id,
                    title,
                    text,
                    petition_current: 0,
                    creation_date: formatDate(creation_date),
                    expiry_date: formatDate(expiry_date),
                    status: "In_Progress"
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'fail',
            message: err.message
        });
    }
}

exports.GetPetitionDeletionPage = (req, res) => {
    const petitionID = req.query.id;
    res.render("delete-form", { petitionID });
}

exports.deletePetition = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send({
            message: "Авторизуйтеся для видалення петиції"
        });
    }
    
    const { password, petitionID } = req.body;
    const user = req.session.user;

    if (user.password !== password) {
        return res.status(403).json({
            status: 'fail',
            message: "Невірний пароль"
        });
    }

    try {
        // Check if petition belongs to user
        const [petitions] = await db.query(
            'SELECT * FROM petitions WHERE id = ? AND author_id = ?',
            [petitionID, user.id]
        );
        
        if (petitions.length === 0) {
            return res.status(404).json({ message: "Петиція не знайдена або не належить вам" });
        }

        // Delete petition 
        await db.query('DELETE FROM petitions WHERE id = ?', [petitionID]);
        
        return res.status(200).json({ message: "Петиція видалена" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Помилка сервера" });
    }
}