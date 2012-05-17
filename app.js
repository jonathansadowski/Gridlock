/***************************************************************
 *
 *	Gridlock (C) 2012 - Jonathan Sadowski
 *	http://jonathansadowski.com/projects/Gridlock
 *	https://github.com/jonathansadowski/Gridlock
 *
 *	Edit config.json to configure Gridlock
 * 
 ***************************************************************/

var nconf = require('nconf');
nconf.argv().env().file({ file: __dirname+'/config.json' });

var bb = require('./bonescript'),
	express = require('express'),
	app = express.createServer(),
	io = require('socket.io').listen(app),
	WebSocket = require('websocket-client').WebSocket,
	rLed = nconf.get('pins:r')?bone[nconf.get('pins:r')]:null,
	yLed = nconf.get('pins:y')?bone[nconf.get('pins:y')]:null,
	gLed = nconf.get('pins:g')?bone[nconf.get('pins:g')]:null,
	rPrimeLed = nconf.get('pins:rPrime')?bone[nconf.get('pins:rPrime')]:null,
	yPrimeLed = nconf.get('pins:yPrime')?bone[nconf.get('pins:yPrime')]:null,
	gPrimeLed = nconf.get('pins:gPrime')?bone[nconf.get('pins:gPrime')]:null,
	buttonPin = nconf.get('pins:modeButton')?bone[nconf.get('pins:modeButton')]:null,
	rState = false,
	yState = false,
	gState = false,
	buttonState = false,
	mode = 'off',
	modes = {
		'off':'off0',
		'red':'red0',
		'yellow':'yellow0',
		'green':'green0',
		'redBlink':'red500off500',
		'yellowBlink':'yellow500off500',
		'traffic':'green30000yellow3000red33000'
	},
	nextMode = function(){
		var isNext = false;
		for(m in modes){
			if(isNext){
				doer(modes[m]); return;
			}
			if(m==mode) isNext=true;
		}
		doer('off0');
	}
	timer = null,
	methods= [], 
	doer = function(stepString){
		if(stepString.match(/^(red|yellow|green|off)$/)){
			stepString+="0";
		} else if(stepString.match(/^(red|yellow|green)Blink$/)){
			stepString=stepString.substr(0,stepString.length-5)+"500off500";
		}

		var newMode = null;
		for(m in modes){
			if(modes[m]==stepString) newMode=m;
		}
		mode=newMode;

		var re = /(red|yellow|green|off)([0-9]+)/g, match, steps=[];
		while(match = re.exec(stepString)){
			steps.push([match[1],match[2]]);
		}

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
	if(rLed) digitalWrite(rLed, !!state?HIGH:LOW);
	if(rPrimeLed) digitalWrite(rPrimeLed, !!state?LOW:HIGH);
	rState = state;
}

function yPin(state){
	if(yLed) digitalWrite(yLed, !!state?HIGH:LOW);
	if(yPrimeLed) digitalWrite(yPrimeLed, !!state?LOW:HIGH);
	yState = state;
}

function gPin(state){
	if(gLed) digitalWrite(gLed, !!state?HIGH:LOW);
	if(gPrimeLed) digitalWrite(gPrimeLed, !!state?LOW:HIGH);
	gState = state;
}

/* These are for bonescript */
setup = function() {
	if(rLed) pinMode(rLed, OUTPUT);
	if(yLed) pinMode(yLed, OUTPUT);
	if(gLed) pinMode(gLed, OUTPUT);
	if(rPrimeLed) pinMode(rPrimeLed, OUTPUT);
	if(yPrimeLed) pinMode(yPrimeLed, OUTPUT);
	if(gPrimeLed) pinMode(gPrimeLed, OUTPUT);
	if(buttonPin) {
		pinMode(buttonPin, INPUT);
		var checkButton = function(){
			var newState = !(digitalRead(buttonPin).toString()*1);
			if(newState != buttonState){
				if(newState)
					nextMode();
				buttonState=newState;
				setTimeout(checkButton,250);
				return;
			}
			setTimeout(checkButton,50);
		};
		checkButton();
	}
	methods.off();
};
loop = function() {
	// Bonescript's loop function works horribly with asynchronous stuff, so we'll just leave it empty
};
/* End bonescript functions */ 

process.on('SIGINT', function () {
	console.log('Cleaning up pins');
	if(gLed) digitalWrite(gLed, LOW);
	if(gPrimeLed) digitalWrite(gPrimeLed, LOW);
	if(yLed) digitalWrite(yLed, LOW);
	if(yPrimeLed) digitalWrite(yPrimeLed, LOW);
	if(rLed) digitalWrite(rLed, LOW);
	if(rPrimeLed) digitalWrite(rPrimeLed, LOW);
	process.kill();
});

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

app.get(/^\/((red|yellow|green|off)|(red|yellow|green)Blink|((red|yellow|green|off)[0-9]+)+)$/, function(req, res){
	var oldMode = mode;
	doer(req.params[0]);
	res.send({'status':'OK', 'oldMode': oldMode, 'newMode': mode});
});

app.get("/next", function(req, res){
	var oldMode = mode;
	nextMode();
	res.send({'status':'OK', 'oldMode': oldMode, 'newMode': mode});
});

app.listen(nconf.get('port'));

var pusherKey = nconf.get('pusher:key');
if(pusherKey){
	var ws = new WebSocket('ws://ws.pusherapp.com:80/app/'+pusherKey+'?client=Gridlock&version=1&protocol=5');
	ws.addListener('data', function(buf) {
		var msg=JSON.parse(buf.toString('utf8')), data=JSON.parse(msg.data);
		switch(msg.event){
			case "pusher:connection_established":
				ws.send(JSON.stringify({"event": "pusher:subscribe","data": {"channel": nconf.get('pusher:channel')}}));
			break;
			case "pusher:ping":
				ws.send(JSON.stringify({"event": "pusher:pong","data":{}}));
			break;
			case "stateChange":
				if(data.state.match(/^((red|yellow|green|off)|(red|yellow|green)Blink|((red|yellow|green|off)[0-9]+)+)$/))
					doer(data.state);
			break;
		}
		console.log(msg,data);
	});
}

io.sockets.on('connection', function (socket) {
	var oldState = {"r":rState,"y":yState,"g":gState,"mode":mode};
	socket.emit('state',oldState);
	setInterval(function(){
		if(oldState.r!=rState||oldState.y!=yState||oldState.g!=gState||oldState.mode!=mode){
			oldState = {"r":rState,"y":yState,"g":gState,"mode":mode};
			socket.emit('state',oldState);
		}
	},50);
});
