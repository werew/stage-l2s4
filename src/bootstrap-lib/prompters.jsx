import React from 'react';
import ReactDOM from 'react-dom';
import * as C from '../common.js';


/**
 * Prompters is the object containing all the handlers that AutoInput
 * can use. Every handler is an object containing one or more functions 
 * and all the usefull stuffs you need in order to manage your suggestions. 
 * There are few things to know:
 *
 * - The name of the handler must correspond with the contents of 
 *   the `name` props passed to `AutoInput`
 * 
 * - Every handler must/can (see required/optional) contain the 
 *   following stuffs:
 *	- A function `init(callback)` (optional):
 *		this function will be called once when the element
 *		is about to be mounted.
 *	- A function `getSuggestions(value,callback)` (required if input):
 *		this function take the actual value of the input and 
 *		must return an array of suggestions
 * 	- A function `getValues()` (required if dropdown):
 *		same as getSuggestions but used for the dropdown
 *
 * TODO update this documentation
 */

export var Prompters = {
	
	/*************************  Handler name="cidr" ***********************/
	cidr: { 
		/* Here will be stored all the network addresses */
		networks: [],

		/* Fill the networks array with the API answer */
		init : function (callback)  { 
			C.getJSON(C.APIURL+'/networks', function(response){
				for (var i = 0; i < response.length; i++){
					this.networks.push(response[i]["addr4"]);
					this.networks.push(response[i]["addr6"]);
				}
			}.bind(this), callback);
		},

		/* Case-insensitive suggestions based on the 
		   beginning of the addresses*/
		getSuggestions: function (value, callback){
			var inputValue = value.trim().toLowerCase();
			var inputLength = inputValue.length;

			if (inputLength === 0) return [];

			return this.networks.filter(function (network) {
		    		return network.toLowerCase().slice(0, inputLength) === inputValue;
		  	});
		},

		getValues: function (){
			return this.networks;
		}
	},

	/*************************  Handler name="machine" ***********************/

	machines: {
		machines: [],

		/* Fill the machines array with the API answer */
		init : function (callback)  { 
			C.getJSON(C.APIURL+'/machines', function(response){
					this.machines = response;
					
			}.bind(this), callback);
		},

		/* Gives all the machines */
		getValues: function (){
			return this.machines;
		}
	},


	/*************************  Handler name="domain" ***********************/
		
	domain: {
		 domains: [],	// [{id: .. domain: ..} , ...]
		_domains: [],	// [ "domain1", "domain2", ... ]

		/* Fill the machines array with the API answer */
		init : function (callback)  { 
			C.getJSON(C.APIURL+'/domains', function(response){
					this.domains = response;
					response.forEach(function(val){
						this._domains.push(val.name);
					}.bind(this));
					
			}.bind(this), callback);
		},

		/* Gives all the machines */
		getValues: function (){
			return this._domains;
		},

		getById: function (id){
			console.log("getbyid");
			console.log(id);
			for (var i = 0; i < this.domains.length; i++){
				console.log(this.domains[i]);
				if (this.domains[i].iddom == id) {
					return this.domains[i].name;
				}
			}
		}
	},

	/*************************  Handler name="addr" ***********************/

	addr: {
		addrs: [],

		/* Fill the machines array with the API answer */
		init : function (callback) { 
			C.getJSON(C.APIURL+'/addr', function(response){
					this.addrs= response;
					
			}.bind(this), callback);
		},

		getSuggestions: function (value, callback){
			var inputValue = value.trim().toLowerCase();
			var inputLength = inputValue.length;

			if (inputLength === 0) return [];

			return this.addrs.filter(function (addr) {
		    		return addr.toLowerCase().slice(0, inputLength) === inputValue;
		  	});
		},

		/* Gives all the addresses */
		getValues: function (){
			return this.addrs;
		}
	},

	/*************************  Handler name="dhcprange" *******************/

	dhcprange: {

		/** TODO **/
		dhcpranges: [],

		init : function (callback) { 

			C.getJSON(C.APIURL+'/dhcpranges', function(response){
					this.dhcpranges = response;
					
			}.bind(this), callback);
		},

		/* Gives all the addresses */
		getValues: function (){
			return this.dhcpranges;
		}



	},
	
	
	/*************************  Handler name="dhcp" *******************/

	dhcp: {

		/** TODO **/
		dhcp: [],

		init : function (callback) { 
			var _callback = function(){this._combine(callback);}.bind(this);

			var c = new CallbackCountdown(_callback,2); /* XXX This will be 3 */

			Prompters.domain.init(c.callback);
			Prompters.dhcprange.init(c.callback);
		},

		_combine: function (callback){
			var dhcpranges = Prompters.dhcprange.getValues();
			var domains = Prompters.domain.getValues();
			for (var i = 0; i < dhcpranges.length; i++){

				var value = Prompters.domain.getById(dhcpranges[i].iddom);
				var doms = { 'values': domains, 'value': value };
				var cpy = $.extend({'domain': doms}, dhcpranges[i]);
				this.dhcp.push(cpy);

			}

			callback();


		},

		/* Gives all the addresses */
		getValues: function (){
			return this.dhcp;
		},

		getEmptyRow: function(){
			return {'domain':  Prompters.domain.getValues() };
		},

		saveNewRow: function(input){
			console.log("--------- SAVE ----------");
			console.log("POST /api/dhcprange "+JSON.stringify(input.data));
		},

		updateRow: function(input){
			console.log("--------- UPDATE ----------");
			console.log("PUT /api/dhcprange/"+input.key+" "+JSON.stringify(input.data));
		},

		deleteRow: function(input){
			console.log("--------- DELETE ----------");
			console.log("DELETE /api/dhcprange/"+input.key);
		}



	}
		

}

var CallbackCountdown = function (callback, n) {
	this.count = 0;
	this.n = n;
	this._callback = callback;
	this.callback = function(){
		this.count++;
		if (this.count >= this.n){
			return this._callback.apply(this, arguments);
		}
	}.bind(this);
}
	
	
