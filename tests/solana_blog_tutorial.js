const assert = require('assert');
const anchor = require('@project-serum/anchor');
const { PublicKey, Connection } = require("@solana/web3.js");
const BN = require('bn.js');
const cluster = "https://api.devnet.solana.com";
const connection = new Connection(cluster, "confirmed");
const { SystemProgram } = anchor.web3;
const { Buffer } = require('buffer');
//const {Blob} = require('buffer');

//const main = async () => {

//describe('#SolanatBlogTutorial', () => { 

//it('can make a BlogPost', async () => {

// Specify provider environment. 
const provider = anchor.Provider.env();
//Set provider.
anchor.setProvider(provider);
const program = anchor.workspace.SolanaBlogTutorial;
const programId = new PublicKey("6JZCuw4DApw1gbwbHSyQUqxEoVtPhGsqADdKCere7cUn");

//This test we are not using Keypair.generate() as below....
//const blogAccount = anchor.web3.Keypair.generate();
//Instead we query {PublicKey} to inform us on the created blogAccount (or ProgramAccount in Solana Terminology)..
//Also, `seeds` and `bump` tell us that our `blog_account` is a PDA that can be derived from their respective values
//Account<'info, BlogAccount> tells us that it should be deserialized to the BlogAccount struct defined below..


console.log("Starting test....");



const getProgramDerivedAddress = async () => {
  const buf = Buffer.from('hello');
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



// let buffer = Buffer.from(arraybuffer);
// let arraybuffer = Uint8Array.from(buffer).buffer;
//const blob = new Blob([buf]);

const initializeAndPostBlog = async () => {
  console.log("Starting `Initialize` test..");
  const { blogAccount, bump } = await getProgramDerivedAddress();

  try {

    let tx = await program.rpc.initialize(new anchor.BN(bump), {
      accounts: {
        blogAccount: blogAccount,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      //signers: [blogAccount],
    });
    //Console.log the Transaction signature of the Initialization procedure. 
    console.log("Initialization transaction signature", tx);
    const account = await getBlogAccount();
    assert.equal(account.authority.toBase58(), provider.wallet.publicKey.toBase58());
    assert.equal(account.count.toNumber(), 0);
    console.log('Account Authority pubKey : ', account.authority.toBase58());
    console.log("Account count is :", account.count.toNumber());
  } catch (error) {
    console.log(error);
  }


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
    console.log('New Blog content :', account.posts[0].blog);
    console.log('Blog Timestamp is :', account.timestamp);
    console.log("Account count is :", account.count.toNumber());

  } catch (error) {
    console.log(error);
  }

// AS ON 16.02.2022 I HAVE NOT BEEN ABLE TO UNDERSTAND HOW TO INVOCATE/ INITIALIZE USING OTHERUSER ACCOUNT AND MAKE BLOG POST FROM THIS ACCOUNT
  // try {
  //   console.log('Starting test : Initialize otherUser ....');
  //   const otherUser = anchor.web3.Keypair.generate();
  //   const signature = await connection.requestAirdrop(otherUser.publicKey, 1000000000);
  //   await connection.confirmTransaction(signature);
  //   console.log("Airdrop confirmed :", await connection.getBalance(otherUser.publicKey));


  //   //lets initialize this new account first
  //   let tx = await program.rpc.initialize(new anchor.BN(bump), {
  //     accounts: {
  //       blogAccount: blogAccount,
  //       authority: otherUser.publicKey,
  //       systemProgram: SystemProgram.programId,
  //     },
  //     // signers: [blogAccount],
  //   });
  //   console.log("OtherUser's initialization successful, signature is :", tx);
  //   console.log("Starting `postBlog` test using `other User`..");
  //   let firstTx = await program.rpc.makePost(new Uint8Array('Veganism : I like Hummus and Pita'), {
  //     accounts: {
  //       blogAccount: blogAccount,
  //       authority: otherUser.publicKey,
  //     }

  //   });

  //   //Console.log the Transaction signature of the postBlog procedure. 
  //   console.log("OtherUser `postBlog` transaction signature", firstTx);
  //   const account = getBlogAccount();
  //   assert.equal(account.authority.toBase58(), otherUser.publicKey.toBase58());
  //   assert.equal(account.posts[0].blog, "Veganism : I like Hummus and Pita");
  //   assert.ok(account.timestamp);
  //   console.log("Authority PubKey is : ", account.authority.toBase58());
  //   console.log('New Blog content :', account.posts[0].blog);
  //   console.log('Blog Timestamp is :', account.timestamp);

  // } catch (error) {
  //   console.log(error);
  // }

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













// const anchor = require('@project-serum/anchor');

// describe('solana_blog_tutorial', () => {

//   // Configure the client to use the local cluster.
//   anchor.setProvider(anchor.Provider.env());

//   it('Is initialized!', async () => {
//     // Add your test here.
//     const program = anchor.workspace.SolanaBlogTutorial;
//     const tx = await program.rpc.initialize();
//     console.log("Your transaction signature", tx);
//   });
// });
