const express = require('express');
const fs = require('fs');
const morgan = require('morgan')
const app = express();

const group = express.Router();

const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));


app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');


group.param('id',(req, res, next, value)=>{
    if(value*1>data.length){
        return  res.status(404).send("Person with this id does not exit");
    }
    next();
})

const getPerson = function(req, res){
    const id = req.params.id*1;
    const person = data.find(el=>el.id ===id);

    res.render("template-one",{
        fullName:person.fullName,
        info:person.info,
        from:person.from,
        age:person.age,
        email:person.email,
        description:person.description,
    });
}

const handleSecondTemp = function(req, res){
    res.render("template-two-cards", {
        people: data
    });
};

const handleThirdTemp = function(req,res){
    res.render("template-three",{
        people:data
    });
}

app.get("/overview",handleThirdTemp);
app.get("/",handleThirdTemp);
group.get("/:id",getPerson)


//group.route("/").get(handleSecondTemp);


app.use('/api/group-overview',group);


app.use((req,res,next)=>{
    res.status(404).send("This URL has not been specified");

})

app.listen(3000, () => console.log('Сервер запущен на http://localhost:3000'));
