/*
* We define the instruments that a musician can play and the sound of each one.
*/
const Instruments = {
	piano: "ti-ta-ti",
	trumpet: "pouet",
	flute: "trulu",
	violin: "gzi-gzi",
	drum: "boum-boum"
};

/*
 This program simulates a "smart" thermometer, which publishes the measured temperature
 on a multicast group. Other programs can join the group and receive the measures. The
 measures are transported in json payloads with the following format:
   {"timestamp":1394656712850,"location":"kitchen","temperature":22.5}
 Usage: to start a thermometer, type the following command in a terminal
        (of course, you can run several thermometers in parallel and observe that all
        measures are transmitted via the multicast group):
   node thermometer.js location temperature variation
*/

var protocol = require('./protocol');

var uuid = require('uuid');

/*
 * We use a standard Node.js module to work with UDP
 */
var dgram = require('dgram');

/*
 * Let's create a datagram socket. We will use it to send our UDP datagrams 
 */
var s = dgram.createSocket('udp4');

/*
 * Let's define a javascript class for our thermometer. The constructor accepts
 * a location, an initial temperature and the amplitude of temperature variation
 * at every iteration
 */
function Musician(Instrument) {

	this.instrument = Instrument;
	this.uuid = uuid.v4();
	this.activeSince = new Date().toString();

/*
   * We will simulate temperature changes on a regular basis. That is something that
   * we implement in a class method (via the prototype)
   */
	Musician.prototype.update = function() {
	 /*
	  * Let's create the measure as a dynamic javascript object, 
	  * add the 3 properties (timestamp, location and temperature)
	  * and serialize the object to a JSON string
	  */
		var infos = {
			uuid: this.uuid,
			instrument: this.instrument,
			activeSince: this.activeSince
		};
		var payload = JSON.stringify(infos);

/*
	   * Finally, let's encapsulate the payload in a UDP datagram, which we publish on
	   * the multicast address. All subscribers to this address will receive the message.
	   */
		message = new Buffer(payload);
		s.send(message, 0, message.length, protocol.PROTOCOL_PORT, protocol.PROTOCOL_MULTICAST_ADDRESS, function(err, bytes) {
			console.log("Sending payload: " + payload + " via port " + s.address().port);
		});

	}

/*
	 * Let's take and send a measure every 500 ms
	 */
	setInterval(this.update.bind(this), 500);

}

/*
 * Let's get the musician propertie from the command line attribute
 * Some error handling after that
 */
var instrument = process.argv[2];

if(Instruments[instrument] === undefined){
	process.on('exit', function(){
		console.log("Instrument non reconnu");
		process.exit(1);
	});
}


/*
 * Let's create a new Musician - the regular publication of infos will
 * be initiated within the constructor
 */
var musician = new Musician(instrument);
