const mysql = require('mysql');
const Connection = require('mysql/lib/Connection');

// Definiendo parametros de conexion
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

connection.connect((error) =>{
    if(error){
        console.log('El error de conexion es: '+error);
        return;
    }
    console.log('CONEXION EXITOSA');
});

// exportar el modulo para utilizarla en todo el proyecto
module.exports = connection;
