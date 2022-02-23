
const assert = require('assert');
const anchor = require('@project-serum/anchor');
const { PublicKey, Connection } = require("@solana/web3.js");
const cluster = "https://api.devnet.solana.com";
const connection = new Connection(cluster, "confirmed");
const { SystemProgram } = anchor.web3;
const { Buffer, SlowBuffer } = require('buffer');



const provider = anchor.Provider.env();
anchor.setProvider(provider);
const program = anchor.workspace.SolanaBlogTutorial;
const programId = new PublicKey("9PDxrRioTz3yGPtVP5unaa9FhT12YdcVADYLiG4CME7i");
//const otherUser = anchor.web3.Keypair.generate();




describe('SolanaBlogTutorial', () => {

  //This test we are not using Keypair.generate() as below....
  //const blogAccount = anchor.web3.Keypair.generate();
  //Instead we query {PublicKey} to inform us using seeds + bump, on the created blogAccount (or ProgramAccount in Solana Terminology)..

  console.log("🚀 Starting test....");

  try {
    it('gets initialized', async () => {
      const { blogAccount, bump } = await getProgramDerivedBlogAddress();
     

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

      console.log('👀 Account Authority pubKey : ', account.authority.toBase58());
      console.log("👀 Account count is :", account.count.toNumber());
    });
  } catch (error) {
    console.log(error);
  }


  try {
    it('can send a blog', async () => {
      const { blogAccount } = await getProgramDerivedBlogAddress();
      const { postAccount, bump } = await getProgramDerivedPostAddress();
      console.log("Starting `postBlog` test using provider.wallet.publicKey..");
      let firstTx = await program.rpc.makePost('Suveet', 'Hi', 'Jai Guru Ji', 'slug-1', new anchor.BN(bump), {
        accounts: {
          blogAccount: blogAccount,
          postAccount: postAccount,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        }
        // signers[postAccount] -> Why we dont have to mention signers? Is it because the 
        // const [postAccount, bump] = await PublicKey.findProgramAddress(
        // [Buffer.from("post"), Buffer.from("slug-1"), provider.wallet.publicKey.toBuffer()], programId
        //  Expression already discovers the program derived Address, which means the PDA has already signed itself ingto existence ??
        //
        );
      });

      //Console.log the Transaction signature of the postBlog procedure. 
      console.log("PostBlog transaction signature", firstTx);
      const newBlogAccount = await getBlogAccount();
      const newPostAccount = await getPostAccount();

      //Asserts and Console Logs
      assert.equal(newBlogAccount.authority.toBase58(), provider.wallet.publicKey.toBase58());
      assert.equal(newPostAccount.blog, "Jai Guru Ji");
      assert.ok(newPostAccount.timestamp);
      console.log("Authority PubKey is : ", newBlogAccount.authority.toBase58());
      console.log('👀 New Blog content :', newPostAccount.blog);
      console.log('New BlogPost author : ', newPostAccount.author);
      console.log('👀 Blog Timestamp is :', newPostAccount.timestamp);
      console.log("👀 Account count is :", newBlogAccount.count.toNumber());
      const post = getPost();
      console.log('New Blog again : ', post);
    });
  } catch (error) {
    console.log(error);
  }




});








async function getProgramDerivedBlogAddress() {
  const buf = Buffer.from('blogstate__________account___');
  const [blogAccount, bump] = await PublicKey.findProgramAddress(
    [buf, provider.wallet.publicKey.toBuffer()],
    programId
  );

  console.log(`Got ProgramDerivedBlogAddress: bump: ${bump}, pubkey: ${blogAccount.toBase58()}`);
  return { blogAccount, bump };

};

async function getProgramDerivedPostAddress() {
  const [postAccount, bump] = await PublicKey.findProgramAddress(
    [Buffer.from("post"), Buffer.from("slug-1"), provider.wallet.publicKey.toBuffer()],
    programId
  );
  console.log(`Got ProgramDerivedPostAddress: bump: ${bump}, pubkey: ${postAccount.toBase58()}`);
  return { postAccount, bump };

}

async function getBlogAccount() {
  const { blogAccount } = await getProgramDerivedBlogAddress();

  try {
    const account = await program.account.blogState.fetch(blogAccount);

    return account;


  } catch (error) {
    console.log(error);
  }
};

async function getPostAccount() {
  const { postAccount } = await getProgramDerivedPostAddress();

  try {
    const account = await program.account.post.fetch(postAccount);
    return account;
  } catch (error) {
    console.log(error);
  }

};

//This is an unused function : Trying to figure out another way to recall the Post as on 23.02.2022 ?? If Someone can help >>??
async function getPost() {

const postAccountInfo = await connection.getAccountInfo(postAccount);
const postAccountState = POST_ACCOUNT_DATA_LAYOUT.decode(
  postAccountInfo.data
);
console.log("Post account state: ", postAccountState);
return postAccountState.post
}





