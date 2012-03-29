var bb = require('./bonescript'),
	express = require('express'),
	app = express.createServer(),
	io = require('socket.io').listen(app),
	rLed = bone.P8_3,
	yLed = bone.P8_4,
	gLed = bone.P8_5,
	rPrimeLed = bone.P8_20,
	yPrimeLed = bone.P8_21,
	gPrimeLed = bone.P8_22,
	rState = false,
	yState = false,
	gState = false,
	timer = null,
	methods= [], 
	doer = function(steps){
		if(timer) clearTimeout(timer);
		var s=function(step){
			if(step >= steps.length) step=0;
			methods[steps[step][0]]();
			if(steps[step][1]>0){
				timer=setTimeout(function(){s(++step);},steps[step][1]);
			}
		};
		s(0);
	};

function rPin(state){
	digitalWrite(rLed, !!state?HIGH:LOW);
	digitalWrite(rPrimeLed, !!state?LOW:HIGH);
	rState = state;
}

function yPin(state){
	digitalWrite(yLed, !!state?HIGH:LOW);
	digitalWrite(yPrimeLed, !!state?LOW:HIGH);
	yState = state;
}

function gPin(state){
	digitalWrite(gLed, !!state?HIGH:LOW);
	digitalWrite(gPrimeLed, !!state?LOW:HIGH);
	gState = state;
}

/* These are for bonescript */
setup = function() {
	pinMode(rLed, OUTPUT);
	pinMode(yLed, OUTPUT);
	pinMode(gLed, OUTPUT);
	pinMode(rPrimeLed, OUTPUT);
	pinMode(yPrimeLed, OUTPUT);
	pinMode(gPrimeLed, OUTPUT);
	methods.off();
};
loop = function() {
	// Bonescript's loop function works horribly with asynchronous stuff, so we'll just leave it empty
};
/* End bonescript functions */ 

methods.red = function(){
	yPin(false);
	gPin(false);
	rPin(true);
};
methods.yellow = function(){
	gPin(false);
	rPin(false);
	yPin(true);
};
methods.green = function(){
	rPin(false);
	yPin(false);
	gPin(true);
};
methods.off = function(){
	gPin(false);
	yPin(false);
	rPin(false);
};

bb.run();

app.use(express.static(__dirname + '/public'));

app.get(/^\/(red|yellow|green|off)$/, function(req, res){
	doer([[req.params[0],0]]);
	methods[req.params[0]]();
	res.send({'status':'OK'});
});

app.get(/^\/(red|yellow|green)Blink$/, function(req, res){
	doer([[req.params[0],500],['off',500]]);
	res.send({'status':'OK'});
});

app.get(/^\/(((red|yellow|green|off)[0-9]+)+)$/, function(req, res){
	var re = /(red|yellow|green|off)([0-9]+)/g, match, steps=[];
	while(match = re.exec(req.params[0])){
		steps.push([match[1],match[2]]);
	}
	doer(steps);
	res.send({'status':'OK'});
})

app.listen(4242);

io.sockets.on('connection', function (socket) {
	var oldState = {"r":rState,"y":yState,"g":gState};
	socket.emit('state',oldState);
	setInterval(function(){
		if(oldState.r!=rState||oldState.y!=yState||oldState.g!=gState){
			oldState = {"r":rState,"y":yState,"g":gState};
			socket.emit('state',oldState);
		}
	},50);
});
