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
app.use(express.urlencoded());

app.get('/listarMedicos', (req, res) => {
    conn.query('SELECT * FROM medicos', (err, rows) => {
        if (err) {
            console.log(err,"No se puedo consutar la base de datos de los medicos");   
        }  
        res.render("medicos/listar", {medicos:  rows});    
    });

    
});

app.get('/medicos/create', (req, res) => {
    res.render('medicos/crear');
});

app.post('/medicos', (req, res) => {
    const nombre = req.body.nombre;
    const apellido = req.body.apellido;
    const dni = req.body.dni;
    const mail = req.body.mail;
    const telefono = req.body.telefono;
    let estado = req.body.estado;
    if (estado === 'on') {
        estado = 1;
    } else {
        estado = 0;
    }
    const fecha_alta = req.body.fecha;

    const sql = 'INSERT INTO `medicos`(`nombre`, `apellido`, `dni`, `mail`, `telefono`, `estado`, `fecha_alta`) VALUES (?,?,?,?,?,?,?)';
    const values = [nombre, apellido, dni, mail, telefono, estado, fecha_alta];

    conn.query(sql, values, (err, rows) => {
        if (err) {
            console.log(err, "No se pudo registrar el médico en la base de datos");
            res.status(500).send("Error al registrar el médico");
        } else {
            res.redirect('/listarMedicos');
        }
    });
});


app.listen(3000, () => {
    console.log('Server listening on port 3000');
}    
);


