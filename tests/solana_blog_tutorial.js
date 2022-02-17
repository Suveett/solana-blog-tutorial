const assert = require('assert');
const anchor = require('@project-serum/anchor');
const { PublicKey, Connection } = require("@solana/web3.js");
const cluster = "https://api.devnet.solana.com";
const connection = new Connection(cluster, "confirmed");
const { SystemProgram } = anchor.web3;
const { Buffer } = require('buffer');
const {Blob} = require('buffer');


// Specify provider environment. 
const provider = anchor.Provider.env();
//Set provider.
anchor.setProvider(provider);
const program = anchor.workspace.SolanaBlogTutorial;
const programId = new PublicKey("9PDxrRioTz3yGPtVP5unaa9FhT12YdcVADYLiG4CME7i");

//This test we are not using Keypair.generate() as below....
//const blogAccount = anchor.web3.Keypair.generate();
//Instead we query {PublicKey} to inform us using seeds + bump, on the created blogAccount (or ProgramAccount in Solana Terminology)..


console.log("🚀 Starting test....");



const getProgramDerivedAddress = async () => {
  const buf = Buffer.from('blog_state');
  const [blogAccount, bump] = await PublicKey.findProgramAddress(
    [buf], programId
  );
  console.log(`Got ProgramDerivedAddress: bump: ${bump}, pubkey: ${blogAccount.toBase58()}`);
  return { blogAccount, bump };
};




const getBlogAccount = async () => {
  const { blogAccount } = await getProgramDerivedAddress();

  try {
    const account = await program.account.blogState.fetch(blogAccount);
    console.log("New Blog account created :", account);
    return account;


  } catch (error) {
    console.log(error);
  }
};



const initializeAndPostBlog = async () => {

  const { blogAccount, bump } = await getProgramDerivedAddress();
  // THIS BELOW TEST WORKS FINE AS ON 17.02.2022
  try {
    //it('gets initialized', async () => {
    console.log("Starting `Initialize` test..");
    let tx = await program.rpc.initialize(new anchor.BN(bump), {
      accounts: {
        blogAccount: blogAccount,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      //signers: [blogAccount],
    });
    //Console.log the Transaction signature of the Initialization procedure. 
    console.log("Initialization transaction signature : ", tx);


    //Asserts and console.logs
    const account = await getBlogAccount();
    assert.equal(account.authority.toBase58(), provider.wallet.publicKey.toBase58());
    assert.equal(account.count.toNumber(), 0);
    assert.ok(account.timestamp);
    console.log('👀 Account Authority pubKey : ', account.authority.toBase58());
    console.log("👀 Account count is :", account.count.toNumber());

  } catch (error) {
    console.log(error);
  }

  //THIS BELOW CODE ALSO NOT WORKING AS ON 17.02.2022 
  //TypeError: Blob.encode[data] requires (length 0) Buffer as src
  //I HAVE TRIED DIFFERENT RESOURCES BY GOOGLING, BUT STILL UNSUCCESSFUL. 
  // CAN SOMEONE PLEASE HELP ??
  try {
    //it('can send a blog', async () => {
    console.log("Starting `postBlog` test using provider.wallet.publicKey..");
    let firstTx = await program.rpc.makePost(new Uint8Array('Hi Suveet'), {
      accounts: {
        blogAccount: blogAccount,
        authority: provider.wallet.publicKey,
      }

    });

    //Console.log the Transaction signature of the postBlog procedure. 
    console.log("PostBlog transaction signature", firstTx);
    const account = await getBlogAccount();
    assert.equal(account.authority.toBase58(), provider.wallet.publicKey.toBase58());
    assert.equal(account.posts[0].blog, "Hi Suveet");
    assert.ok(account.timestamp);
    //console.log("Authority PubKey is : ", account.authority.toBase58());
    console.log('👀 New Blog content :', account.posts[0].blog);
    console.log('👀 Blog Timestamp is :', account.timestamp);
    console.log("👀 Account count is :", account.count.toNumber());

  } catch (error) {
    console.log(error);
  }

  // AS ON 16.02.2022 I HAVE NOT BEEN ABLE TO UNDERSTAND HOW TO `test` INVOCATION/ INITIALIZATION OF
  //`OTHERUSER` ACCOUNTS (AKA `CLIENTS WHO USE MY APP`) 
  //AND MAKE BLOG POSTS FROM THOSE ACCOUNTS
  // I TRIED THE CODE BELOW BUT IT SAYS "Error: Signature verification failed", 
  //MAYBE BECAUSE THE `BLOGACCOUNT` IS CREATED USING PROVIDER.WALLET.PUBLICKEY AS SIGNER DURING INITIALIZATION
  //WHOSE SECRET KEY IS DIFFERENT FROM OTHERUSER.PUBLICKEY
  //BUT THEN HOW TO CHECK CODE ON BEHALF OF CLIENTS ?

  try {
    console.log('Starting test : Initialize otherUser ....');
    const otherUser = anchor.web3.Keypair.generate();
    const signature = await connection.requestAirdrop(otherUser.publicKey, 1000000000);
    await connection.confirmTransaction(signature);
    console.log("Airdrop confirmed :", await connection.getBalance(otherUser.publicKey));


    //lets initialize this new account first
    let tx = await program.rpc.initialize(new anchor.BN(bump), {
      accounts: {
        blogAccount: blogAccount,
        authority: otherUser.publicKey,
        systemProgram: SystemProgram.programId,
      },
        signers: [otherUser,blogAccount],
    });
    const account = getBlogAccount();
    assert.equal(account.count.toNumber(), 0);
    assert.equal(account.authority.toBase58(), otherUser.publicKey.toBase58());
    assert.ok(account.timestamp);
    console.log("OtherUser's initialization successful, signature is :", tx);
  

    console.log("Starting `postBlog` test using `other User`..");
    let firstTx = await program.rpc.makePost(new Uint8Array('Veganism : I like Hummus and Pita'), {
      accounts: {
        blogAccount: blogAccount,
        authority: otherUser.publicKey,
      }

    });

    //Console.log the Transaction signature of the postBlog procedure. 
    console.log("OtherUser `postBlog` transaction signature", firstTx);
    const newAccount = getBlogAccount();
    assert.equal(newAccount.authority.toBase58(), otherUser.publicKey.toBase58());
    assert.equal(newAccount.count.toNumber(), 1);
    assert.equal(newAccount.posts[0].blog, "Veganism : I like Hummus and Pita");
    assert.ok(newAccount.timestamp);
    console.log("Authority PubKey is : ", newAccount.authority.toBase58());
    console.log('New Blog content :', newAccount.posts[0].blog);
    console.log('Blog Timestamp is :', newAccount.timestamp);
    console.log("Blog count is : ", newAccount.count.toNumber());
  } catch (error) {
    console.log(error);
  }

};





const runTests = async () => {

  try {
    await initializeAndPostBlog();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }

}

runTests();






// let buffer = Buffer.from(arraybuffer);
// let arraybuffer = Uint8Array.from(buffer).buffer;
//const blob = new Blob([buf]);

