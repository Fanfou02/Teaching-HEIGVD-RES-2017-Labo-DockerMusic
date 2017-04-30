/*
 This program simulates an auditor, which joins a multicast
 group in order to receive sounds published by musicians.
 The sounds are transported in json payloads with the following format:
   {"uuid":1394656712850,"Instrument":"piano","activeSince":Saturday 9h00}
 Usage: to start the station, use the following command in a terminal
   node auditor.js
*/

/*
 * We have defined the multicast address and port in a file, that can be imported both by
 * auditor.js and musician.js. The address and the port are part of our simple 
 * application-level protocol
 */
var protocol = require('./protocol');

/*
 * We use a standard Node.js module to work with UDP
 */
var dgram = require('dgram');

/* 
 * Let's create a datagram socket. We will use it to listen for datagrams published in the
 * multicast group by musicians and containing infos
 */
var s = dgram.createSocket('udp4');
s.bind(protocol.PROTOCOL_PORT, function() {
  console.log("Joining multicast group");
  s.addMembership(protocol.PROTOCOL_MULTICAST_ADDRESS);
});


var musicians = new Map();

/* 
 * This call back is invoked when a new datagram has arrived. We update the map of active musicians
 */
s.on('message', function(msg, source) {
	console.log("Data has arrived: " + msg + ". Source port: " + source.port);
	var currentMessage = JSON.parse(msg);
	if(!musicians.has(currentMessage.uuid)){
		musicians.set(currentMessage.uuid, {
			'uuid' : currentMessage.uuid,
			'instrument' : currentMessage.instrument,
			'activeSince' : new Date()
		});
	}
	else {
		musicians.get(currentMessage.uuid).activeSince = new Date();
	}
});


/* 
 * This is a simple TCP server that can listen for client and return the list of active musicians
 */
var net = require('net');

var tcpServer = net.createServer(function(envoi){
	
	var toSend = [];
	var date = new Date();

	musicians.forEach(function(value, key){
		if(date - value.activeSince <= 5000)
			toSend.push(value);
		else 
			musicians.delete(key);
	});

	envoi.write(JSON.stringify(toSend));
	envoi.write('\r\n');
	envoi.end();
});

tcpServer.listen(protocol.PROTOCOL_PORT);