const fs = require('fs');
const path = require("path");

const petitions = JSON.parse(fs.readFileSync(path.join(__dirname, 'petitions.json'), 'utf8'));

const statusMap = {
    "rejected": "Відхилено",
    "accepted": "Прийнято",
    "on-review": "На розгляді",
    "expired": "Термін вийшов"
};

exports.changePetStatus =  function(){
    const now = Date.now();
    const random = Math.floor(Math.random() * 3);
    const statuses  = ['rejected','accepted','on-review','expired',"In_Progress"];


    petitions.forEach(petition => {
        if(petition.status === "In_Progress"){
            if(petition.petition_current >= 25000){
                petition.status = statuses[random];
            }
            if (new Date(petition.expiry_date).getTime() < now){
                petition.status = statuses[3];
            }
            else{
                petition.status = "In_Progress"
            }
        }
    });
}

exports.getPetitions = (req,res)=>{
    const activePetitions = petitions.filter(petition =>petition.status ==="In_Progress");
    res.render('index', {petitions:activePetitions});
}

exports.getPetitionCreationPage = (req,res)=>{
    res.render('create-petition');
}

exports.getPetitionOverview = (req,res)=>{
    const petitionId = req.params.id;
    const petition = petitions.find(petition => petition.id === petitionId*1); // Conversion to a number by * 1

    if (!petition) {
        return res.status(404).send("Петиція не знайдена"); // convert to middleware
    }

    res.render('view-petition', {
        id: petition.id,
        title: petition.title,
        text: petition.text,
        author_id: petition.author_id,
        petition_current:petition.petition_current,
        expiry_date:petition.expiry_date
    });
}

exports.petitionVoting = (req,res)=>{
    if (!req.session.user) {
        return res.redirect("/login");
    }
    const userId = req.session.user.id;
    const petition = petitions.find(p => p.id === req.params.id * 1);

    if (!petition) {
        return res.status(404).json({ message: "Петиція не знайдена" });
    }

    if (!Array.isArray(petition.voters)) {
        petition.voters = [];
    }

    if (petition.voters.includes(userId)) {
        return res.status(400).json({ message: "Ви вже голосували за цю петицію" });
    }
    petition.petition_current += 1;
    petition.voters.push(userId);

    fs.writeFile("petitions.json", JSON.stringify(petitions, null, 2), (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Помилка запису файлу" });
        }
        return res.status(200).json({
            message: "Голос зараховано",
            petition_current: petition.petition_current
        });
    });
}

exports.getCompletedPetitions = (req,res)=>{
    const completedPetitions = petitions.filter(petition=>petition.status !== "In_Progress")
    res.render("completed-petitions",{
        petitions:completedPetitions,
        statusMap
    });
}

exports.getMyPetitions= (req,res) =>{
    if (!req.session.user) {
        return res.redirect("/login");
    }
    const sessionId = req.session.user.id;
    const usersPetitions = petitions.filter(p => p.author_id === sessionId);

    res.render("my-petitions",{
        usersPetitions
    });
}

exports.petitionCreation=(req,res)=>{
    if(!req.session.user) {
        return res.status(401).send({
            message:"Авторизуйтеся для створення петиції"
        })
    }

    const {title, text} = req.body;


    if(!title || !text) {
        return  res.redirect("/login");
    }

    const author_id = req.session.user.id;
    const newId = petitions.length+1;
    const creation_date = new Date();
    const expiry_date = new Date();

    expiry_date.setMonth(creation_date.getMonth() + 1);

    const formatted_creation_date = creation_date.toISOString().split('T')[0];
    const formatted_expiry_date = expiry_date.toISOString().split('T')[0];

    const petition = {
        id:newId,
        author_id,
        title,
        text,
        petition_current:0,
        creation_date:formatted_creation_date,
        expiry_date:formatted_expiry_date,
        status:"In_Progress"

    }
    petitions.push(petition);

    fs.writeFile("petitions.json", JSON.stringify(petitions,null,2),(err)=>{
        if(err){
            console.error(err.message);
            return res.status(500).json({
                status:'fail',
                message:err.message,
            });
        }
        console.log("Дані були записані")
        res.status(200).json({
            status:'success',
            data:{
                petition
            }
        });

    });
}

exports.GetPetitionDeletionPage = (req,res)=>{
    const petitionID = req.query.id;
    res.render("delete-form",{petitionID});
}

exports.deletePetition=(req,res)=>{
    if(!req.session.user){
        return res.status(401).send({
            message:"Авторизуйтеся для видалення петиції"
        })
    }
    const {password, petitionID} = req.body
    console.log(password);
    const user = req.session.user;

    if(user.password !== password){
        return res.status(403).json({
            status:'fail',
            message:"Невірний пароль"
        })
    }

    const index = petitions.findIndex(p => p.id === petitionID * 1);
    if (index === -1) {
        return res.status(404).json({ message: "Петиція не знайдена" });
    }

    petitions.splice(index,1);
    fs.writeFileSync("petitions.json", JSON.stringify(petitions, null, 2));
    return res.status(200).json({ message: "Петиція видалена" });
}

