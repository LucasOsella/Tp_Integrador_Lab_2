const express = require('express');
const pug = require('pug');
const mysql = require('mysql2');
const app = express();
const path = require('path');

const conn = mysql.createConnection({
        port: 3306,
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'lab_2_ac_bd'
    });


app.set('view engine', 'pug');
app.set('views','views');
app.use(express.static('public'));

app.get('/medicos', (req, res) => {
    conn.query('SELECT * FROM medicos', (err, rows) => {
        if (err) {
            console.log(err,"No se puedo consutar la base de datos de los medicos");   
        }  
        res.render("medicos/listar", {medicos:  rows});    
    });

    
});

app.listen(3000, () => {
    console.log('Server listening on port 3000');
}    
);


