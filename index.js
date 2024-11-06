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
app.set('views','./views');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));


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

app.post('/medicos/crear', (req, res) => {
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

app.get('/medicos/editar/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM medicos WHERE id_medico = ?';
    conn.query(sql, [id], (err, rows) => {
        if (err) {
            console.log(err, "No se pudo recuperar el registro");
            res.status(500).send("Error al recuperar el registro");
        } else {
            const medico = rows[0];
            // Convertir fecha_alta al formato YYYY-MM-DD si existe
            if (medico && medico.fecha_alta) {
                medico.fecha_alta = medico.fecha_alta.toISOString().split('T')[0];
            }
            res.render('medicos/editar', { medico });
        }
    });
});


app.post('/medicos/subir/:id', (req, res) => {
    const id_medico = req.params.id;  // Obtén el ID desde los parámetros de la URL
    console.log(id_medico);
    const { nombre, apellido, dni, mail, telefono, fecha} = req.body;
    let estado = req.body.estado === 'on' ? 1 : 0;
 

    const sql = 'UPDATE medicos SET nombre = ?, apellido = ?, dni = ?, mail = ?, telefono = ?, estado = ?, fecha_alta = ? WHERE id_medico = ?';
    const values = [nombre, apellido, dni, mail, telefono, estado, fecha, id_medico];

    conn.query(sql, values, (err, rows) => {
        if (err) {
            console.log(err, "No se pudo actualizar el registro");
            res.status(500).send("Error al actualizar el registro");
        } else {
            res.redirect('/listarMedicos');
        }
    });
});





app.listen(3000, () => {
    console.log('Server listening on port 3000');
}    
);


