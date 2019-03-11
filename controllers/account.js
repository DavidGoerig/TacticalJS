import DatabaseInstance from './mongodb'
import assert from 'assert'

class AccountInstance {


    constructor(){
    }

    static createAccount(account) {
        if (!account.hasOwnProperty('username') || !account.hasOwnProperty('password')) {
            console.log('username and password required');
            return;
        }
        DatabaseInstance.insertDocument(DatabaseInstance.accounts, account);
    }



}

AccountInstance.type = 'AccountInstance';
export default AccountInstance;
