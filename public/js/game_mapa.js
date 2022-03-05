class Game{
	constructor(){
		if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
		
		this.container;
		this.player = { };
		this.controls;
		this.camera;
		this.scene;
		this.renderer;
		this.remoteColliders = []; // 
		this.targetList = [];	//
		this.projector;
		this.canvas1;
		this.context1;
		this.texture1;
		this.sprite1;
		this.spriteMaterial;
		this.mouse = new THREE.Vector2();
		this.INTERSECTED;


		
		this.container = document.createElement( 'div' );
		this.container.style.height = '100%';
		document.body.appendChild( this.container );
        
		const game = this;
		
		// this.assetsPath = '../assets/';
		
		this.clock = new THREE.Clock();
        
        this.init();

		window.onError = function(error){
			console.error(JSON.stringify(error));
		}
	}


	
	init() {

		// this.projector = new THREE.Projector();// 

		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1000, 200000 );
		this.camera.position.set(23000, 13000, 8000);
        this.camera.lookAt( 0, 0, 0 );
		this.scene = new THREE.Scene();
		

        let ambient = new THREE.AmbientLight(0xa0a0a0);
        
		let light = new THREE.HemisphereLight( 0xdddddd, 0x444444 );
		light.position.set( 0, 200, 0 );
		this.scene.add( light );

		// model
		const loader = new THREE.FBXLoader();
		const game = this;
		
		this.loadEnvironment(loader);
		
		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.shadowMap.enabled = true;
		this.container.appendChild( this.renderer.domElement );

        // CONTROL ORBITAL
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 150, 0);
		this.controls.enableDamping = true;
		this.controls.enableZoom = true;
		this.controls.enablePan = false;

		window.addEventListener( 'resize', function(){ game.onWindowResize(); }, false );

		this.createColliders();

		/////// Dibujar texto en canvas /////////

		// Crear el  elemento canvas
		this.canvas1 = document.createElement('canvas');
		this.context1 = this.canvas1.getContext('2d');
		this.context1.font = "Bold 30px Arial";
		this.context1.fillStyle = "rgba(0,0,0,0.95)";
		this.context1.fillText('Hello, world!', 0, 20);
		
		// el contenido del lienzo se utilizará para la textura
		this.texture1 = new THREE.Texture(this.canvas1);
		this.texture1.needsUpdate = true;

		////////////////////////////////////////
	
		// this.spriteMaterial = new THREE.SpriteMaterial( {
		// 	map: this.texture1,
		// 	useScreenCoordinates: false,
		// 	alignment: spriteAlignment
		// });

		this.spriteMaterial = new THREE.SpriteMaterial({ map: this.texture1});

		this.sprite1 = new THREE.Sprite( this.spriteMaterial );
		this.sprite1.scale.set(200,100,1.0);
		this.sprite1.position.set( 50, 50, 0 );
		this.scene.add( this.sprite1 );	

		//////////////////////////////////////////

		// EVENTO MOUSE MOVE
		window.addEventListener( 'mousemove', game.onDocumentMouseMove(this.spriteMaterial), false );

		// EVENTO CLICK
		if ('ontouchstart' in window){
			window.addEventListener( 'touchdown', (event) => game.onMouseDown(event), false );
		}else{
			window.addEventListener( 'mousedown', (event) => game.onMouseDown(event), false );	
		}

	}

	// CLICK EVENT
	onMouseDown( event ) {
		// the following line would stop any other event handler from firing
		// (such as the mouse's TrackballControls)
		//event.preventDefault();

		this.mouse.x = ( event.clientX / this.renderer.domElement.clientWidth ) * 2 - 1;
		this.mouse.y = - ( event.clientY / this.renderer.domElement.clientHeight ) * 2 + 1;
		console.log("Click.");

		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera( this.mouse, this.camera );
		const intersects = raycaster.intersectObjects( this.remoteColliders );
		
		if (intersects.length>0){
			console.log("viaje rapido");
		}

	}

	createColliders(){
        const geometry = new THREE.BoxGeometry(9000, 4000, 5000);
        const material = new THREE.MeshBasicMaterial({color:0x222222, wireframe:true});

        const respaw1__blv = new THREE.Mesh(geometry, material);
		respaw1__blv.position.set(-7000,2000,15000);
		respaw1__blv.name = "Entrada Boulevard"
		this.scene.add(respaw1__blv);

		const respaw2__rev = new THREE.Mesh(geometry, material);
		respaw2__rev.position.set(9000,2000,-22000);
		respaw2__rev.name = "Entrada Revolucion"
		this.scene.add(respaw2__rev);

		
		const respaw3__audi = new THREE.Mesh(geometry, material);
		respaw3__audi.position.set(2000,2000,-1000);
		respaw3__audi.name = "Auditorio Ingeniero Jorge Matute Remus"
		this.scene.add(respaw3__audi);


		this.remoteColliders.push(respaw1__blv);
		this.remoteColliders.push(respaw2__rev);
		this.remoteColliders.push(respaw3__audi);

		console.log(this.remoteColliders);

    }
	
    loadEnvironment(loader){
		const game = this;
		loader.load('libs/MiniQCI(VBlender).fbx', function(object){
			game.environment = object;
			game.colliders = [];
			game.scene.add(object);
            
			object.traverse( function ( child ) {
				if ( child.isMesh ) {
					if (child.name.startsWith("proxy")){
						game.colliders.push(child);
						child.material.visible = false;
					}else{
						child.castShadow = true;
						child.receiveShadow = true;
					}
				}
			} );
			
			const tloader = new THREE.CubeTextureLoader();
			// tloader.setPath( `${game.assetsPath}/images/` );

			var textureCube = tloader.load( [
				'libs/px.jpg', 'libs/nx.jpg',
				'libs/py.jpg', 'libs/ny.jpg',
				'libs/pz.jpg', 'libs/nz.jpg'
			] );

			game.scene.background = textureCube;
			
			game.animate();
		})
	}
    
	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
	}

	animate() {
		const game = this;
		const dt = this.clock.getDelta();
		
		requestAnimationFrame( function(){ game.animate(); } );
		
		this.renderer.render( this.scene, this.camera );
		
        this.controls.update();
		// game.update();
	}

	update(){
		// crear un rayo con origen en la posición del mouse
		// y dirección en la escena (dirección de la cámara)
		var vector = new THREE.Vector3( this.mouse.x, this.mouse.y, 1 );
		// this.projector.unprojectVector( vector, this.camera );
		vector.unproject(this.camera);
		var ray = new THREE.Raycaster( this.camera.position, vector.sub( this.camera.position ).normalize() );
		ray.setFromCamera(this.mouse, this.camera);// 
		// create an array containing all objects in the scene with which the ray intersects
		var intersects = ray.intersectObjects(this.scene.children );

		// INTERSECTED = the object in the scene currently closest to the camera 
		//		and intersected by the Ray projected from the mouse position 	
		
		// if there is one (or more) intersections
		if ( intersects.length > 0 )
		{
			console.log("si hay intersecciones")
			// if the closest object intersected is not the currently stored intersection object
			if ( intersects[ 0 ].object != this.INTERSECTED ) 
			{
				console.log(intersects[0]);
				// restore previous intersection object (if it exists) to its original color
				if ( this.INTERSECTED ) 
					this.INTERSECTED.material.color.setHex( this.INTERSECTED.currentHex );
				// store reference to closest object as current intersection object
				this.INTERSECTED = intersects[ 0 ].object;
				// store color of closest object (for later restoration)
				this.INTERSECTED.currentHex = this.INTERSECTED.material.color.getHex();
				// set a new color for closest object
				this.INTERSECTED.material.color.setHex( 0xffff00 );
				
				// update text, if it has a "name" field.
				if ( intersects[ 0 ].object.name )
				{
					this.context1.clearRect(0,0,640,480);
					var message = intersects[ 0 ].object.name;
					var metrics = this.context1.measureText(message);
					var width = metrics.width;
					this.context1.fillStyle = "rgba(0,0,0,0.95)"; // black border
					this.context1.fillRect( 0,0, width+8,20+8);
					this.context1.fillStyle = "rgba(255,255,255,0.95)"; // white filler
					this.context1.fillRect( 2,2, width+4,20+4 );
					this.context1.fillStyle = "rgba(0,0,0,1)"; // text color
					this.context1.fillText( message, 4,25 );
					this.texture1.needsUpdate = true;
				}
				else
				{
					this.context1.clearRect(0,0,300,300);
					this.texture1.needsUpdate = true;
				}
			}
		} 
		else // there are no intersections
		{
			// restore previous intersection object (if it exists) to its original color
			if ( this.INTERSECTED ) 
				this.INTERSECTED.material.color.setHex( this.INTERSECTED.currentHex );
			// remove previous intersection object reference
			//     by setting current intersection object to "nothing"
			this.INTERSECTED = null;
			this.context1.clearRect(0,0,300,300);
			this.texture1.needsUpdate = true;
		}
		this.controls.update();
		this.stats.update();
	}


	onDocumentMouseMove( event ) {
		// the following line would stop any other event handler from firing
		// (such as the mouse's TrackballControls)
		//event.preventDefault();

		// update sprite position
		console.log(this.spriteMaterial);
		this.sprite1.position.set( event.clientX, event.clientY - 20, 0 );
		
		// update the mouse variable
		const mouse = new THREE.Vector2();
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	}
}

class respawns { // clase para mis puntos de viaje rapido
	
}