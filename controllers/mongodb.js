import MongoClient from 'mongodb'
import assert from 'assert'
import * as DatabaseConfig from '../config/database'
import AccountInstance from "./account";

class DatabaseInstance {


    constructor(){
    }

    static _connectToMongo() {
        MongoClient.connect(`mongodb://${DatabaseConfig.host}:${DatabaseConfig.port}`, {useNewUrlParser: true}, (err, client) => {
            assert.equal(null, err);
            this.db = client.db(DatabaseConfig.db_name);
            this.accounts = this.db.collection('accounts');
            console.log("Connected successfully to server");
        });
    }


    static insertManyDocument(collection, documents) {
        collection.insertMany(documents, function(err, r) {
            assert.equal(null, err);
            assert.equal(documents.length(), r.insertedCount);
        });
    }

    static insertDocument(collection, document) {
        collection.insertOne(document, function(err, r) {
            assert.equal(null, err);
            assert.equal(1, r.insertedCount);
        });
    }

    static disconnect() {
        this.db.close();
    }

    static createAccount() {
        console.log('account created !');
    }


}

DatabaseInstance._connectToMongo();
DatabaseInstance.type = 'DatabaseInstance';

export default DatabaseInstance;
