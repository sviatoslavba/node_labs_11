const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');

const app = express()
const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));

app.use(morgan('dev'));

const petitions = JSON.parse(fs.readFileSync(path.join(__dirname, 'petitions.json'), 'utf8'));

app.get(["/","/api/petitions"], (req, res) => {
    res.render('index', {petitions});

})





app.get("/api/petition-creation", (req, res) => {
    res.render('create-petition');
})

app.get("/api/petition-overview/:id", (req, res) => {
    const petitionId = req.params.id;
    const petition = petitions.find(petition => petition.id === petitionId*1); // Conversion to a number by * 1

    if (!petition) {
        return res.status(404).send("Петиция не найдена");
    }

    res.render('view-petition', {
        title: petition.title,
        text: petition.text,
        author_id: petition.author_id,
        petition_current:petition.petition_current,
        expiry_date:petition.expiry_date
    });
})


app.listen(PORT,()=>console.log(`Server started on ${PORT}`));