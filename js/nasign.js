'use strict';

var User = function(jsonStr) {
    if (jsonStr) {
        var obj = JSON.parse(jsonStr);
        this.address = obj.address;    
        this.timestamp = obj.timestamp;
    } else {
        this.address = "";
        this.timestamp = 0;
    }
};

User.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

var NasignContract = function() {
    LocalContractStorage.defineProperty(this, "userNumber");   
    LocalContractStorage.defineProperty(this, "adminAddress");  
    LocalContractStorage.defineMapProperty(this, "userPool", {  
        parse: function(jsonText) {
            return new User(jsonText);
        },
        stringify: function(obj) {
            return obj.toString();
        }
    });
};

NasignContract.prototype = {
    init: function() {
        this.signNumber = 0;
        this.adminAddress = "n1HTEmh96nWz57iYhjwsBttR5MwVVy1nFD9";
    },

    getuserNumber: function() {
        return this.signNumber;
    },

    sign: function() {
        var from = Blockchain.transaction.from;
        var value = Blockchain.transaction.value;
        if (value != 0) {
            throw new Error("Sorry, you can't pay any nas.");
        }
        if (this.isUserAddressExists(from)) {
            var user = this.userPool.get(from);
            var now = new Date().getTime();
            if ( (now - user.timestamp) < 3600*12*1000 )
            {
                throw new Error("Sorry, you can't sign twice one day.");
            }
            user.timestamp = now;
            this.userPool.set(from, user); 
        } else {
            this.signNumber = this.signNumber+1;
            var user = new User();
            user.address = from;
            user.timestamp = new Date().getTime();
            this.userPool.put(from, user); 
        }
        var result = Blockchain.transfer(user.address, 0.001 * 1000000000000000000);
        if (!result) {
            Event.Trigger("GetNasTransferFailed", {
                Transfer: {
                    from: Blockchain.transaction.to,
                    to: user.address,
                    value: 0.001
                }
            });
            throw new Error("GetNas transfer failed.");
        }
    },

    addnas: function() {
        var from = Blockchain.transaction.from;
        var value = Blockchain.transaction.value;
        if (from != this.adminAddress) {
            throw new Error("Permission denied.");
        }
        if (value != 1 * 1000000000000000000) {
            throw new Error("Sorry, please add 1 NAS only.");
        }
    },

    isUserAddressExists: function(address) {
        var user = this.userPool.get(address);
        if (!user) {
            return false;
        }
        return true;
    }

}

module.exports = NasignContract;