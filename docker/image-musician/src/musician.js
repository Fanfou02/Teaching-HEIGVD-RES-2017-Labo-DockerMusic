/*
 This program simulates a musician, which publishes the sound of his instrument
 on a multicast group. Other programs can join the group and receive the sounds. The
 sounds are transported in json payloads with the following format:
   {"uuid":1394656712850,"instrument":"kitchen","activeSince":22.5}
 Usage: to start a musician, type the following command in a terminal
        (of course, you can run several musicians in parallel and observe that all
        sounds are transmitted via the multicast group):
   node musician.js instrument
*/


/*
 * The protocol where the port number and broadcast adress is define
 */
var protocol = require('./protocol');

/*
 * We use uuid module for identificate musicians
 */
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
 * Let's define a javascript class for our Musician. The constructor accepts
 * an instrument.
 */
function Musician(Instrument) {

	this.instrument = Instrument;
	this.uuid = uuid.v4();
	this.activeSince = new Date().toString();

  /*
   * We will send sounds every 500 ms in the multicast group
   */
	Musician.prototype.update = function() {
	 /*
	  * Let's create the infos as a dynamic javascript object, 
	  * add the 3 properties (uuid, instrument and activeSince)
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
	 * Let's take and send an info every 500 ms
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
