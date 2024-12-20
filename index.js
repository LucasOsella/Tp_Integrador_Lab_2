const express = require('express');
const pug = require('pug');
const mysql = require('mysql2');
const app = express();
const path = require('path');

const conn = mysql.createConnection({
        port: 3306,
        host: 'bvpwxrqheqe2nrgm5zrc-mysql.services.clever-cloud.com',
        user: 'utt86elgd0jv8tze',
        password: 'm5mz3Mds9MjXaBlMuTWK',
        database: 'bvpwxrqheqe2nrgm5zrc'
    });


app.set('view engine', 'pug');
app.set('views','./views');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.redirect('/index');
})
 
app.get('/index', async (req, res) => {
    res.render('principal/index');
});

app.get('/medicos/especialidad/:id', (req, res) => {
    const especialidadId = req.params.id;
    const sql = `
        SELECT medicos.id_medico, medicos.nombre, medicos.apellido 
        FROM medicos
        JOIN especialidad_medico ON medicos.id_medico = especialidad_medico.id_medico
        WHERE especialidad_medico.id_especialidad = ?
    `;
    
    conn.query(sql, [especialidadId], (err, rows) => {
        if (err) {
            console.error("Error al obtener los médicos:", err);
            res.status(500).send("Error al obtener los médicos");
        } else {
            res.json(rows);
        }
    });
});


function obtenerEspecialidades() {
    return new Promise((resolve, reject) => {
        conn.query('SELECT * FROM especialidad', (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

function obtenerEspecialidadMedico() {
    return new Promise((resolve, reject) => {
        conn.query('SELECT * FROM especialidad_medico', (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

function obtenerMedicos() {
    return new Promise((resolve, reject) => {
        conn.query('SELECT * FROM medicos', (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}


app.get('/listarMedicos', (req, res) => {
    // Realizamos una consulta para obtener los médicos y sus especialidades
    const query = `
        SELECT 
            medicos.id_medico, 
            medicos.nombre, 
            medicos.apellido, 
            medicos.mail, 
            medicos.telefono, 
            medicos.estado, 
            especialidad.nombre AS especialidad 
        FROM medicos
        LEFT JOIN especialidad_medico ON medicos.id_medico = especialidad_medico.id_medico
        LEFT JOIN especialidad ON especialidad_medico.id_especialidad = especialidad.id_especialidad
    `;

    conn.query(query, (err, rows) => {
        if (err) {
            console.log("No se pudo consultar la base de datos de los médicos:", err);
            return res.status(500).send("Error al obtener médicos y sus especialidades");
        }

        // Agrupamos las especialidades para cada médico
        const medicosMap = rows.reduce((acc, row) => {
            if (!acc[row.id_medico]) {
                acc[row.id_medico] = {
                    id_medico: row.id_medico,
                    nombre: row.nombre,
                    apellido: row.apellido,
                    mail: row.mail,
                    telefono: row.telefono,
                    estado: row.estado,
                    especialidades: []
                };
            }
            // Agregamos la especialidad al médico actual
            if (row.especialidad) {
                acc[row.id_medico].especialidades.push(row.especialidad);
            }
            return acc;
        }, {});

        // Convertimos el objeto en un arreglo para pasarlo a la vista
        const medicosConEspecialidades = Object.values(medicosMap);

        res.render("medicos/listar", { medicos: medicosConEspecialidades });
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

app.get('/medicos/especialidad', (req, res) => {
    const obtenerMedicos = new Promise((resolve, reject) => {
        conn.query('SELECT * FROM medicos', (err, rows) => {
            if (err) {
                console.log("No se pudo recuperar los médicos:", err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });

    const obtenerEspecialidades = new Promise((resolve, reject) => {
        conn.query('SELECT * FROM especialidad', (err, rows) => {
            if (err) {
                console.log("No se pudo consultar la base de datos de las especialidades:", err);
                reject(err);
            } else if (!Array.isArray(rows)) {
                console.log("Error: los datos de especialidades no son un arreglo");
                reject(new Error("Error al obtener especialidades"));
            } else {
                resolve(rows);
            }
        });
    });

    Promise.all([obtenerMedicos, obtenerEspecialidades])
        .then(([medicos, especialidades]) => {
            res.render('medicos/especialidad', { medicos, opciones: especialidades });
        })
        .catch(err => {
            console.log("Error al obtener los datos:", err);
            res.status(500).send("Error al obtener los datos");
        });
});


app.post('/medicos/subirEspecialidad', (req, res) => {
    const nombre = req.body.especialidad;
    const sql = 'INSERT INTO `especialidad`(`nombre`) VALUES (?)';
    conn.query(sql, [nombre], (err, rows) => {
        if (err) {
            console.log(err, "No se pudo registrar la especialidad en la base de datos");
            res.status(500).send("Error al registrar la especialidad");
        } else {
            res.redirect('/listarMedicos');
        }
    });
});

app.post('/medicos/asignarEspecialidad', (req, res) => {
    const opcionE = req.body.especialidadId;
    const opcionM = req.body.medicoId;
    const matricula= req.body.matricula;
    const sql = 'INSERT INTO `especialidad_medico`(`id_medico`, `id_especialidad`, `matricula`) VALUES (?,?,?)';
    conn.query(sql, [opcionM, opcionE, matricula], (err, rows) => {
        if (err) {
            console.log(err, "No se pudo registrar la especialidad en la base de datos");
            res.status(500).send("Error al registrar la especialidad");
        } else {
            res.redirect('/listarMedicos');
        }
    });
});

app.get('/datos', (req, res) => {
    res.render('paciente/datos');
});

app.get('/medicos/horarios/:id', (req, res) => {
    const id_medico = req.params.id;

    // Consulta para obtener la información del médico
    const sqlMedico = 'SELECT * FROM medicos WHERE id_medico = ?';
    const sqlEspecialidades =` 
        SELECT *
        FROM especialidad e
        JOIN especialidad_medico me ON e.id_especialidad = me.id_especialidad
        WHERE me.id_medico = ?
    `
    ;

    // Ejecutar ambas consultas
    conn.query(sqlMedico, [id_medico], (err, rowsMedico) => {
        if (err) {
            console.log(err, "No se pudo obtener la información del médico");
            res.status(500).send("Error al obtener la información del médico");
        } else {
            const medico = rowsMedico[0];

            // Ahora obtener las especialidades del médico
            conn.query(sqlEspecialidades, [id_medico], (err, rowsEspecialidades) => {
                if (err) {
                    console.log(err, "No se pudieron obtener las especialidades");
                    res.status(500).send("Error al obtener las especialidades");
                } else {
                    const especialidades = rowsEspecialidades;

                    // Renderiza la vista con la información del médico y sus especialidades
                    res.render('medicos/horarios', { medico, especialidades });
                }
            });
        }
    });
});

app.post('/medicos/subirHorarios', (req, res) => {
    const id_medico = req.body.id_medico;
    const especialidad_id = req.body.especialidad;
    const horaIn = req.body.horaIn;
    const horaFin = req.body.horaFin;
    const duracion = req.body.duracion;
    const fecha = req.body.fecha;
    const estado=req.body.estado;
    const sql = 'INSERT INTO `horarios_agenda`(`id_medico`, `id_especialidad`,`fecha`, `hora_inicio`, `hora_fin`, `duracion`, `estado` ) VALUES (?,?,?,?,?,?,?)';
    conn.query(sql, [id_medico, especialidad_id, fecha, horaIn, horaFin, duracion, estado ], (err, rows) => {
        if (err) {
            console.log(err, "No se pudo registrar el horario en la base de datos");
            res.status(500).send("Error al registrar el horario");
        } else {
            res.redirect('/listarMedicos');
        }
    })
});

app.get('/medicos/horariosDisponibles/:id', (req, res) => {
    const id_medico = req.params.id;
    const fecha = req.query.fecha;

    const sql = `
        SELECT * 
        FROM horarios_agenda 
        WHERE id_medico = ? AND fecha = ? AND estado Like 'Libre'
    `;

    conn.query(sql, [id_medico, fecha], (err, rows) => {
        if (err) {
            console.error("Error al obtener los horarios:", err);
            return res.status(500).json({ error: "Error al obtener los horarios" });
        }
        res.json(rows);
    });
});

app.post('/pacientes/subir', (req, res) => {
    const nombre = req.body.nombre;
    const apellido = req.body.apellido;
    const dni = req.body.dni;
    const obraSocial = req.body.obraSocial;
    const motivo = req.body.motivo; 
    const mail = req.body.mail; 
    const telefono = req.body.telefono; 
    const fecha= new Date();

    const sql= 'INSERT INTO `pacientes`(`nombre`, `apellido`, `dni`, `e-mail`, `telefono`, `obra_social`, `fecha_alta`) VALUES (?,?,?,?,?,?,?)';
    conn.query(sql, [nombre, apellido, dni, mail, telefono, obraSocial,fecha], (err, rows) => {
        if (err) {
            console.log(err, "No se pudo registrar el paciente en la base de datos");
            res.status(500).send("Error al registrar el paciente");
        } else {
            console.log("Paciente registrado con exito");
            res.redirect('/listarPacientes');
        }
    })
})

app.get('/agenda', async (req, res) => {
    const medicos = await obtenerMedicos();
    console.log(medicos); // Verifica si medicos contiene datos
    
    if (!medicos) {
        return res.status(500).send('No se pudo obtener la lista de médicos');
    }

    res.render('medicos/agenda', { medicos });
});

app.get('/principal/turnos/:id/:id_medico/:fecha', (req, res) => {
   const horario = req.params.id;
   const id_medico = req.params.id_medico;
   const fecha= req.params.fecha;
   if (!id_medico) {
       return res.status(400).send('ID de médico no proporcionado');
   }
   console.log(id_medico);
   console.log(horario);

   const sql = 'SELECT * FROM pacientes';
   conn.query(sql, (err, rows) => {
       if (err) {
           console.log(err);
           res.status(500).send('Error al obtener los pacientes');   
       } else {
           res.render('principal/turnos', { 
            pacientes: rows, 
            id_medico,
            horario,
            fecha
           });
       }
   })
});

app.post('/crearTurno', (req, res) => {
    const id_paciente = req.body.paciente;
    const id_medico = req.body.id_medico;
    const horario=req.body.horario;
    const fecha=req.body.fecha;
    const motivo=req.body.motivo;
    const contacto=req.body.contacto;
    const obra_social=req.body.obra_social;
    const id_sucursal=1
    const estado="Pendiente"
    const sql = 'INSERT INTO `turnos`(`id_paciente`, `id_medico`, `id_sucursal`,`fecha`,`hora`,`motivo_consulta`,`obra_social`) VALUES (?,?,?,?,?,?,?)';
    conn.query(sql, [id_paciente, id_medico, id_sucursal, fecha, horario, motivo,obra_social], (err, rows) => {
        if (err) {
            console.log(err, "No se pudo registrar el turno en la base de datos");
            res.status(500).send("Error al registrar el turno");
        } else {
            res.redirect('/index');
        }
    })

});

app.get('/listarPacientes', (req, res) => {
    const sql = 'SELECT * FROM pacientes';
    conn.query(sql, (err, rows) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error al obtener los pacientes');   
        } else {
            res.render('paciente/listar', { pacientes: rows });
        }
    })
})

app.get('/listarTurnos', (req, res) => {
    const sql = `
        SELECT 
            ma.id_turno, ma.fecha, ma.hora AS hora, ma.estado,
            m.nombre AS nombre_medico, m.apellido AS apellido_medico,
            p.nombre AS nombre_paciente, p.apellido AS apellido_paciente
        FROM turnos AS ma
        JOIN medicos AS m ON ma.id_medico = m.id_medico
        JOIN pacientes AS p ON ma.id_paciente = p.id_paciente
    `;

    conn.query(sql, (err, rows) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error al obtener los turnos');   
        } else {
            res.render('medicos/listadoturnos', { turnos: rows });
        }
    });
});

app.listen(3000, () => {
    console.log('Server listening on port 3000');
}    
);

