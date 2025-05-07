const { Petition, Author, Signature, sequelize } = require('../models');
const { Op } = require('sequelize');

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
  const statuses = ['rejected', 'accepted', 'on-review', 'expired'];

  try {
    const petitions = await Petition.findAll({
      where: { 
        status: 'In_Progress',
        [Op.or]: [
          { petition_current: { [Op.gte]: 25000 } },
          { expiry_date: { [Op.lt]: now } }
        ]
      }
    });

    for (const petition of petitions) {
      let newStatus = "In_Progress";
      
      if (petition.petition_current >= 25000) {
        newStatus = statuses[random];
      } else if (new Date(petition.expiry_date) < now) {
        newStatus = "expired";
      }

      await petition.update({ status: newStatus });
    }
  } catch (err) {
    console.error("Error updating petition statuses:", err);
  }
};

exports.getPetitions = async (req, res) => {
  try {
    const activePetitions = await Petition.findAll({
      where: { status: "In_Progress" },
      include: [{
        model: Author,
        attributes: ['username'],
        as: 'Author'
      }],
      order: [['creation_date', 'DESC']]
    });
    
    const formattedPetitions = activePetitions.map(petition => ({
      ...petition.get({ plain: true }),
      creation_date: formatDate(petition.creation_date),
      expiry_date: formatDate(petition.expiry_date),
      author_username: petition.Author.username
    }));

    res.render('index', { petitions: formattedPetitions });
  } catch (err) {
    console.error(err);
    res.status(500).send("Помилка сервера");
  }
};

exports.getPetitionCreationPage = (req, res) => {
  res.render('create-petition');
};

exports.getPetitionOverview = async (req, res) => {
  const petitionId = req.params.id;
  
  try {
    const petition = await Petition.findOne({
      where: { id: petitionId },
      include: [{
        model: Author,
        attributes: ['username'],
        as: 'Author'
      }]
    });
    
    if (!petition) {
      return res.status(404).send("Петиція не знайдена");
    }

    res.render('view-petition', {
      id: petition.id,
      title: petition.title,
      text: petition.text,
      author_username: petition.Author.username,
      petition_current: petition.petition_current,
      expiry_date: formatDate(petition.expiry_date)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Помилка сервера");
  }
};

exports.petitionVoting = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Необхідно авторизуватися" });
  }
  
  const userId = req.session.user.id;
  const petitionId = req.params.id;

  const t = await sequelize.transaction();

  try {
    const [signature, created] = await Signature.findOrCreate({
      where: { author_id: userId, petition_id: petitionId },
      defaults: { author_id: userId, petition_id: petitionId },
      transaction: t
    });

    if (!created) {
      await t.rollback();
      return res.status(400).json({ message: "Ви вже голосували за цю петицію" });
    }

    await Petition.increment('petition_current', {
      by: 1,
      where: { id: petitionId },
      transaction: t
    });

    const updatedPetition = await Petition.findByPk(petitionId, { transaction: t });

    await t.commit();

    return res.status(200).json({
      message: "Голос зараховано",
      petition_current: updatedPetition.petition_current
    });
  } catch (err) {
    await t.rollback();
    console.error(err);
    return res.status(500).json({ message: "Помилка сервера" });
  }
};

exports.getCompletedPetitions = async (req, res) => {
  try {
    const completedPetitions = await Petition.findAll({
      where: { 
        status: { [Op.ne]: 'In_Progress' }
      },
      include: [{
        model: Author,
        attributes: ['username'],
        as: 'Author'
      }],
      order: [['creation_date', 'DESC']]
    });
    
    const formattedPetitions = completedPetitions.map(petition => ({
      ...petition.get({ plain: true }),
      creation_date: formatDate(petition.creation_date),
      expiry_date: formatDate(petition.expiry_date),
      author_username: petition.Author.username
    }));

    res.render("completed-petitions", {
      petitions: formattedPetitions,
      statusMap
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Помилка сервера");
  }
};

exports.getMyPetitions = async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  
  const sessionId = req.session.user.id;
  
  try {
    const usersPetitions = await Petition.findAll({
      where: { author_id: sessionId },
      include: [{
        model: Author,
        attributes: ['username'],
        as: 'Author'
      }],
      order: [['creation_date', 'DESC']]
    });
    
    const formattedPetitions = usersPetitions.map(petition => ({
      ...petition.get({ plain: true }),
      creation_date: formatDate(petition.creation_date),
      expiry_date: formatDate(petition.expiry_date),
      author_username: petition.Author.username
    }));

    res.render("my-petitions", {
      usersPetitions: formattedPetitions
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Помилка сервера");
  }
};

exports.petitionCreation = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Авторизуйтеся для створення петиції"
    });
  }

  const { title, text } = req.body;
  if (!title || !text) {
    return res.status(400).json({
      message: "Необхідно заповнити всі поля"
    });
  }

  const author_id = req.session.user.id;
  const creation_date = new Date();
  const expiry_date = new Date();
  expiry_date.setMonth(creation_date.getMonth() + 1);

  const t = await sequelize.transaction();

  try {
    const newPetition = await Petition.create({
      author_id,
      title,
      text,
      creation_date,
      expiry_date,
      status: "In_Progress",
      petition_current: 0
    }, { transaction: t });

    await t.commit();
    
    res.status(201).json({
      status: 'success',
      data: {
        petition: {
          id: newPetition.id,
          title: newPetition.title,
          text: newPetition.text,
          petition_current: newPetition.petition_current,
          creation_date: formatDate(newPetition.creation_date),
          expiry_date: formatDate(newPetition.expiry_date),
          status: newPetition.status
        }
      }
    });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.GetPetitionDeletionPage = (req, res) => {
  const petitionID = req.query.id;
  res.render("delete-form", { petitionID });
};

exports.deletePetition = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
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

  const t = await sequelize.transaction();

  try {
    const petition = await Petition.findOne({
      where: { id: petitionID, author_id: user.id },
      transaction: t
    });
    
    if (!petition) {
      await t.rollback();
      return res.status(404).json({ 
        message: "Петиція не знайдена або не належить вам" 
      });
    }

    await Signature.destroy({
      where: { petition_id: petitionID },
      transaction: t
    });

    await Petition.destroy({
      where: { id: petitionID },
      transaction: t
    });
    
    await t.commit();
    return res.status(200).json({ message: "Петиція видалена" });
  } catch (err) {
    await t.rollback();
    console.error(err);
    return res.status(500).json({ message: "Помилка сервера" });
  }
};