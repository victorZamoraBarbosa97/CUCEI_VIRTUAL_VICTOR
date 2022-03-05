// Server 
// importando las librerias
const bcryptjs = require('bcryptjs'); // modulo para encriptar las contraseñas
const session = require('express-session'); // para las sesiones del ususarios
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
var bodyParser = require('body-parser');


// levantar el servidor
http.listen(2002, function(){
	console.log('Escuchando el puerto 2002');
});
  

// setear urlencoded para capturar los datos del formulario
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//app.use(express.urlencoded({extended:true}));
//app.use(express.json());

// invocamos a dotenv
const dotenv = require('dotenv');
//const { dirname } = require('path');
dotenv.config({path:'./env/.env'})

// donde cargar los archivos estaticos
app.use('/resources',express.static('public'));
// app.use('/resources', express.static(__dirname + '/public'));

// funciones para chat global 
const { generateMessage, generateLocationMessage } = require('./public/js/message.js')
const { isRealString } = require('./public/js/validation')
const { Users } = require('./public/js/users')
const users = new Users()
//motor de plantillas
app.set('view engine','ejs');

//6 -Invocamos a bcrypt
const bcrypt = require('bcryptjs');

// variables de sesion
app.use(session({
	// tipos de sesiones del usuario
	secret:'keyboard cat',
	// como se van a guardar las sesiones
	resave: true,
	saveUninitialized: true,
	maxAge: 3600000
}));

// invocamos al modulo de de conexion de la BD
const conection = require('./database/db');
const req = require('express/lib/request');
const connectionDB = require('./database/db');

// Seteamos direcciones del progrma
app.get('/login',(req, res)=>{
	res.render('login');
})



app.get('/game', (req, res) => {
	if (req.session.loggedin) { // si hay una sesion iniciada
		res.render('game',{
			login: true,
			name: req.session.name,
			room: req.session.room		// por default el servidor es global
		});		
	}
	else{
		res.render('game',{
			login: false,
			name: "invitado",
			room: "global"		// por default el servidor es global
		});
	}
	// res.end();
})

app.get('/sala', function (req, res){
	if (req.session.loggedin) { // si hay una sesion iniciada
		res.render('sala',{
			login: true,
			name: req.session.name,
			room: req.session.room		// por default el servidor es global
		});		
	}
	else{
		res.render('game',{
			login: false,
			name: "invitado",
			room: "global"		// por default el servidor es global
		});
	}
})

// Configuracion sala
app.get('/select-room',  (req, res) => {
	// console.log("si entro");
	// const name_user = req.query.name;
	// const room_user = req.query.room;
	// console.log(name_user);
	// console.log(room_user);
	// obteniendo nombre de la sala ingresada
	req.session.room = req.body.room;

	if (req.session.loggedin) { // si hay una sesion iniciada
		res.render('game',{
			login: true,
			name: req.session.name,
			room: req.session.room		// por default el servidor es global
		});		
	}
	else{
		res.render('game',{
			login: false,
			name: "invitado",
			room: "global"		// por default el servidor es global
		});
	}
});



// Metodo para registrar usuarios
app.post('/Registro', async (req, res)=>{
	// obteniendo los datos
	const nombre_completo = req.body.nombre_completo;
	const codigo = req.body.codigo;
	const correo = req.body.correo;
	const usuario = req.body.usuario;
	const pass = req.body.contrasena;
	let passwordHash = await bcrypt.hash(pass, 8); // encriptar la contraseña
	const rol = req.body.rol;

	// insertar en la base de datos 
    conection.query('INSERT INTO usuarios SET ?',{nombre_completo:nombre_completo, codigo:codigo, correo:correo, usuario,usuario, contrasena:passwordHash, rol,rol}, async (error, results)=>{
        // Mostrar error o alerta de registro completo
		if(error){
            console.log(error);
        }else{
			res.render('login', {
				alert: true,
				alertTitle: "Registro",
				alertMessage: "¡Registro Completado!",
				alertIcon:'success',
				showConfirmButton: false,
				timer: 2000,
				ruta: ''
			});
            // res.redirect('/');         
        }
	});
})

// Iniciar sesion
app.post('/auth', async (req, res) => {
	// obteniendo los datos
	const correo = req.body.correo; 
	const pass = req.body.contrasena;
	// encriptar la password
	let passwordHaash = await bcryptjs.hash(pass, 8);
	// verificar que los datos fueron ingresados
	if(correo && pass){
		connectionDB.query('SELECT * FROM usuarios WHERE correo = ?', [correo], async (correo, results)=> { // verificar solo correo
			if( results.length == 0 || !(await bcrypt.compare(pass, results[0].contrasena)) ) { 			// si no encontramos el usuario o la contraseña es incorrecta
				// SWEET ALERT 
				res.render('login', {
					alert: true,
					alertTitle: "Error",
					alertMessage: "USUARIO y/o PASSWORD incorrectas",
					alertIcon:'error',
					showConfirmButton: true,
					timer: '',
					ruta: 'login'
				});
			}else{
				//creamos una var de sesion y le asignamos true si INICIO SESSION       
				req.session.loggedin = true;                
				req.session.name = results[0].nombre_completo; // guardamos el nombre completo del usuario
				res.render('login', {
					alert: true,
					alertTitle: "Conexión exitosa",
					alertMessage: "¡LOGIN CORRECTO!",
					alertIcon:'success',
					showConfirmButton: false,
					timer: 1500,
					ruta: ''
				}); 
			}
		});

	}else{
		res.render('login', {
			alert: true,
			alertTitle: "Advertencia",
			alertMessage: "Por favor ingresa un usuario y una contraseña",
			alertIcon:'warning',
			showConfirmButton: true,
			timer: '',
			ruta: 'login'
		}); 
	}
});

// Autenticacion para todas las paginas.
app.get('/', (req, res)=> {
	if (req.session.loggedin) {
		res.render('index',{
			login: true,
			name: req.session.name,
			room: 'global'		// por default el servidor es global
		});		
	} else {
		res.render('index',{
			login:false,
			name:'Invitado',
			room: 'global'			
		});			
	}
	// res.end();
});

// Log out
app.get('/logout', (req, res)=>{
	req.session.destroy(()=>{
		res.render('index',{
			login:false,
			name:'Invitado',
			room: 'global'
		});
	})
})


/*FUNCIONES SOCKET.IO*/ 

io.sockets.on('connection', (socket) => { 		// funcion por default cuando se conecta un socket

	socket.userData = { x:0, y:0, z:0, heading:0 };		//Localizacion de usuario por default 
 
	console.log(`${socket.id} Conectado:`);
	socket.emit('setId', { id:socket.id });
	
    socket.on('disconnect', function(){ // funcion defaul desconectar 
		socket.broadcast.emit('EliminarJugador', { id: socket.id });
		console.log(`${socket.id} Desconectado`);
    });
	
	socket.on('init', function(data){
		console.log(`socket.init ${data.model}`);
		socket.userData.model = data.model;
		socket.userData.colour = data.colour;
		socket.userData.x = data.x;
		socket.userData.y = data.y;
		socket.userData.z = data.z;
		socket.userData.heading = data.h;
		socket.userData.pb = data.pb,
		socket.userData.action = "Idle";
	});
	
	socket.on('update', function(data){
		socket.userData.x = data.x;
		socket.userData.y = data.y;
		socket.userData.z = data.z;
		socket.userData.heading = data.h;// rotacion en 
		socket.userData.pb = data.pb, 	// rotacion en x
		socket.userData.action = data.action;
	});
	
	socket.on('chat mensaje', function(data){ 
		console.log(`mensaje del chat:${data.id} ${data.message}`); // imprimir mensaje en consola
		io.to(data.id).emit('chat mensaje', { id: socket.id, message: data.message });
	})



	// SOCKET.IO CHAT GLOBAL // 
	socket.on('join', ({ name, room }, callback) => {
		if (room==null && name==null){ // si es un invitado el que se quiere un
			room = "global";
			name = "invitado";
		}
		if (!isRealString(room)) {
		  return callback('El nombre de la sala es requerido.')
		}
	
		console.log(`${name} Se ha unido a la sala`)
	
		socket.join(room)
		users.removeUser(socket.id)
		const user = users.addUser(socket.id, name, room)
	
		console.log('Nuevo Usuario', user)
	
		io.to(room).emit('actualizar lista de usuarios', users.getUserList(room))
	
		socket.emit(
		  'newMessage',
		  generateMessage('Admin', 'Bienvenido a CUCEI VIRTUAL')
		)
	
		socket.broadcast
		  .to(room)
		  .emit('newMessage', generateMessage('Admin', `${name} se ha unido`))
	
		callback()
	})

	socket.on('createMessage', (msg, callback) => {
		const user = users.getUser(socket.id)
	
		if (user) {
		  console.log('createMessage', user)
		  const { room, name } = user
		  io.to(room).emit('newMessage', generateMessage(name, msg.text))
		}
	
		callback()
	  })
});


setInterval(function(){
	const nsp = io.of('/');
    let pack = [];
	//console.log(io.sockets.sockets);
    for(let id in io.sockets.sockets){ // no entra al for 
        const socket = nsp.connected[id];
		//inserta solo los sockets que se han inicializado
		if (socket.userData.model!==undefined){
			pack.push({
				id: socket.id,
				model: socket.userData.model,
				colour: socket.userData.colour,
				x: socket.userData.x,
				y: socket.userData.y,
				z: socket.userData.z,
				heading: socket.userData.heading,
				pb: socket.userData.pb,
				action: socket.userData.action
			});   
		}
    }
	if (pack.length>0) io.emit('remoteData', pack);
}, 40);


