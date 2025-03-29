'use strict';

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
app.use(express.json());

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

app.post("/api/petition-creation",(req, res) => {
    const {title, text} = req.body;


    if(!title || !text) {
        return  res.status(400).json({
            status: 'fail',
            message:"Заповніть всі поля"
        })
    }

    const author_id = Math.floor(Math.random() * (10 - 1 + 1)) + 1;
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
        expiry_date:formatted_expiry_date

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
});

app.listen(PORT,()=>console.log(`Server started on ${PORT}`));