use self::id as program_id;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
//use std::str::from_utf8;

declare_id!("9PDxrRioTz3yGPtVP5unaa9FhT12YdcVADYLiG4CME7i");

#[program]
pub mod solana_blog_tutorial {
    //use anchor_lang::solana_program::system_instruction::create_nonce_account_with_seed;

    use super::*;

    // `seeds` and `bump` tell us that our `blog_account` is a PDA that can be derived from their respective values
    
    pub fn initialize(ctx: Context<Initialize>, blog_account_bump: u8) -> ProgramResult {
        let blog = &mut ctx.accounts.blog_account;
        let authority = &mut ctx.accounts.authority;
        

        blog.authority = *authority.key;
        blog.count = 0;
        blog.bump = blog_account_bump;
        blog.owner = program_id();
        
        Ok(())
    }

    pub fn make_post(ctx: Context<MakePost>, 
        author : String, 
        title : String,  
        post: String , 
        slug : String,
        post_account_bump : u8
        

        ) -> ProgramResult {

        // ?? What to do if we were to pass Data as a Uint8Array from Client side ?? //
        // let post = from_utf8(&new_post_as_bytes) // convert the array of bytes into a string slice
        //     .map_err(|err| {
        //         msg!("Invalid UTF-8, from byte {}", err.valid_up_to());
        //         ProgramError::InvalidInstructionData
        //     })?;
        // msg!(post); // msg!() is a Solana macro that prints string slices to the program log, which we can grab from the transaction block data

        if post.chars().count() > 5000 {
            return Err(ErrorCode::ContentTooLong.into());
        }
        if slug.len() > 10 || title.len() > 50 {
            return Err(ErrorCode::SlugOrTitleTooLong.into())
        }

        if author.len() > 25 {
            return Err(ErrorCode::AuthorTooLong.into())
        }

        let blog = &mut ctx.accounts.blog_account;
        let authority = &mut ctx.accounts.authority;
        let post_account = &mut ctx.accounts.post_account;
        let clock = Clock::get().unwrap();
       
        
        blog.count += 1;

        post_account.timestamp = clock.unix_timestamp;
        post_account.blog = post;
        post_account.user_address = *authority.to_account_info().key;
        post_account.slug = slug.to_string();
        post_account.bump = post_account_bump;

        Ok(())
    }

    

    //Account<'info, BlogState> tells us that it should be deserialized to the BlogState struct defined further down below..
    #[derive(Accounts)]
    #[instruction(blog_account_bump: u8)]
    pub struct Initialize<'info> {
        #[account(init, seeds = [b"blogstate__________account___".as_ref(), authority.key.as_ref()], bump = blog_account_bump, payer = authority, space = BlogState::LEN)]
        blog_account: Account<'info, BlogState>,
        #[account(mut)]
        authority: Signer<'info>,
        #[account(address = system_program::ID)]
        system_program: AccountInfo<'info>,
    }

    
    #[derive(Accounts)]
    #[instruction(post_account_bump: u8, post: Post)]
    pub struct MakePost<'info> {
        #[account(mut, has_one = authority)] 
        blog_account: Account<'info, BlogState>,
        #[account(init, 
            seeds = [b"post".as_ref(), blog_account.key().as_ref(), post.slug.as_ref()],
            bump = post_account_bump, 
            payer = authority,
            space = Post::LEN)
            ] 
        post_account : Account<'info, Post>,
        #[account(mut)]
        authority: Signer<'info>,
        #[account(address = system_program::ID)]
        system_program : AccountInfo<'info>,
    }



    #[account]
    // #[derive(Default)]
    pub struct BlogState {
        pub authority: Pubkey,
        pub count: u64,
        //pub posts: Vec<Post>,
        pub bump: u8,
        pub owner: Pubkey,
       
       
    }

    // 2. Add some useful constants for sizing properties.

    const DISCRIMINATOR_LENGTH: usize = 8;
    const PUBLIC_KEY_LENGTH: usize = 32;
    const TIMESTAMP_LENGTH: usize = 8;
    const COUNT_LENGTH : usize = 16;
    const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
    const MAX_AUTHOR_LENGTH : usize = 100;
    const MAX_TITLE_LENGTH : usize = 200; //50 chars max * 4 bytes as nobody would read such indordinately big Introductions
    const MAX_CONTENT_LENGTH: usize = 20000; // 5000 chars * 4 max length of bytes allowed for a Blog
    const SLUG_LENGTH : usize = 40;
    const BUMP_LENGTH : usize = 1;

    // 3. Add a constant on the Blog account that provides its total size.
    impl BlogState {
        const LEN: usize = DISCRIMINATOR_LENGTH
    + PUBLIC_KEY_LENGTH // Public key of the BlogAccount
    + PUBLIC_KEY_LENGTH //PublicKey of the Authority, aka User
    + PUBLIC_KEY_LENGTH //Public key of the Owner, aka PROGRAM_ID
    + BUMP_LENGTH
    + COUNT_LENGTH; // 
    }


   
    #[account]
    pub struct Post {
        pub blog: String,
        pub user_address: Pubkey,
        pub slug : String,
        pub bump : u8,
        pub author : String,
        pub title : String,
        pub timestamp: i64,
        
    }

    //4. Add a constant on the Post account that provides its total size
    impl Post {
        const LEN : usize = DISCRIMINATOR_LENGTH 
        + PUBLIC_KEY_LENGTH // Public Key of the PostAccount
        + PUBLIC_KEY_LENGTH // Public Key of the Authority, aka User
        + BUMP_LENGTH
        + TIMESTAMP_LENGTH // Timestamp.
        + STRING_LENGTH_PREFIX
        + SLUG_LENGTH
        + STRING_LENGTH_PREFIX 
        + MAX_AUTHOR_LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_TITLE_LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_CONTENT_LENGTH; // THIS IS THE BLOG CONTENT LENGTH 
    }


    #[error]
    pub enum ErrorCode {
        #[msg("You are not authorized to perform this action.")]
        Unauthorized,
        #[msg("The provided Blog should be 5000 characters long maximum.")]
        ContentTooLong,
        #[msg("Title cannot be more than 50 characters And Slug cannot be more than 10 characters")]
        SlugOrTitleTooLong,
        #[msg("Author Name cannot be more than 25 characters")]
        AuthorTooLong

    }
}
