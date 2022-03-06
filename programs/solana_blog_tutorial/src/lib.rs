use self::id as program_id;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
//use std::str::from_utf8;

declare_id!("5ftRvxoMzkEQGoF5queGKoh7Bow9dP8bXhdh1R5GEFEk");

#[program]
pub mod solana_blog_tutorial {
   

    use super::*;

    // `seeds` and `bump` tell us that our `blog_account` is a PDA that can be derived from their respective values
    
    pub fn initialize_blog(ctx: Context<InitializeBlog>, blog_account_bump: u8) -> ProgramResult {
        let blog = &mut ctx.accounts.blog_account;
        let authority = &mut ctx.accounts.authority;
        

        blog.authority = *authority.key;
        blog.post_count = 0;
        blog.bump = blog_account_bump;
        blog.owner = program_id();
        
        Ok(())
    }

    pub fn make_post(ctx: Context<MakePost>, 
        author_name : String, 
        title : String,  
        content: String , 
        slug : String,
        post_account_bump : u8
        

        ) -> ProgramResult {

        // ?? What to do if we were to pass Data as a Uint8Array from Client side ?? 
        // I am not sure if this will be ever needed, but whats if its needed ?
        // HOW TO ACTUALLY DO IT ??
        // let post = from_utf8(&new_post_as_bytes) // convert the array of bytes into a string slice
        //     .map_err(|err| {
        //         msg!("Invalid UTF-8, from byte {}", err.valid_up_to());
        //         ProgramError::InvalidInstructionData
        //     })?;
        // msg!(post); 
        // // msg!() is a Solana macro that prints string slices to the program log, which we can grab from the transaction block data

        if content.chars().count() > 5000 {
            return Err(ErrorCode::ContentTooLong.into());
        }
        if slug.len() > 10 || title.len() > 50 {
            return Err(ErrorCode::SlugOrTitleTooLong.into())
        }

        if author_name.len() > 32 {
            return Err(ErrorCode::AuthorNameTooLong.into())
        }

        let blog = &mut ctx.accounts.blog_account;
        let authority = &mut ctx.accounts.authority;
        let post = &mut ctx.accounts.post_account;
        let clock = Clock::get().unwrap();
       
        
        blog.post_count += 1;

        post.timestamp = clock.unix_timestamp;
        post.blog = *blog.to_account_info().key;
        post.author = *authority.to_account_info().key;
        post.slug = slug.to_string();
        post.bump = post_account_bump;
        post.title = title.to_string();
        post.content = content.to_string();
        post.author_name = author_name.to_string();

        Ok(())
    }

    
    // #[instruction] Macro allows us to give instructions while initiating the below blog_account account using the MakePost struct.
    //Account<'info, BlogState> tells us that it should be deserialized to the BlogState struct defined further down below..
    // authority.key() allows this Account to be initiated using the authority(i.e User's) publicKey address
    #[derive(Accounts)]
    #[instruction(blog_account_bump: u8)]
    pub struct InitializeBlog<'info> {
        #[account(init, seeds = [b"blog".as_ref(), 
        authority.key().as_ref()], 
        bump = blog_account_bump, 
        payer = authority, 
        space = BlogState::LEN)
        ]
        blog_account: Account<'info, BlogState>,

        #[account(mut)]
        authority: Signer<'info>,
        #[account(address = system_program::ID)]
        system_program: AccountInfo<'info>,
    }

    // #[instruction] Macro allows us to give instructions while initiating the below 'post_account' account using the MakePost struct.
    // has_one = authority enforces the constraint that BlogState.authority == blog_account.authority.key
    //Account<'info, Post> tells us that it should be deserialized to the Post struct defined further down below..
    // post : Post allows us to use the slug registered with Post while initiating this Account
    // blog_account.key() allows the below 'Post' Account to be associated with its blog_account
    #[derive(Accounts)]
    #[instruction(post_account_bump: u8, post: Post)]
    pub struct MakePost<'info> {
        #[account(mut, has_one = authority)] 
        pub blog_account: Account<'info, BlogState>,
        #[account(init, 
            seeds = [b"post".as_ref(), 
            blog_account.key().as_ref(), 
            post.slug.as_ref()],
            bump = post_account_bump, 
            payer = authority,
            space = Post::LEN)
            ] 
        pub post_account : Account<'info, Post>,

        #[account(mut)]
        pub authority: Signer<'info>,
        #[account(address = system_program::ID)]
        pub system_program : AccountInfo<'info>,
    }


    // #[account] attribute gives the constraint that its a PDA owned by the program.
    #[account]
    // #[derive(Default)]
    pub struct BlogState {
        pub authority: Pubkey,
        pub post_count: u64,
        pub bump: u8,
        pub owner: Pubkey,
       
       
    }

    // 2. Add some useful constants for sizing properties.

    const DISCRIMINATOR_LENGTH: usize = 8;
    const PUBLIC_KEY_LENGTH: usize = 32;
    const TIMESTAMP_LENGTH: usize = 8;
    const POST_COUNT_LENGTH : usize = 32;
    const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
    const MAX_TITLE_LENGTH : usize = 200; //50 chars max * 4 bytes as nobody would read such indordinately big Introductions
    const MAX_CONTENT_LENGTH: usize = 20000; // 5000 chars * 4 max length of bytes allowed for a Post as no one would read such a long Post                                         
    const MAX_AUTHOR_LENGTH : usize = 128;
    const SLUG_LENGTH : usize = 40;
    const BUMP_LENGTH : usize = 1;

    // 3. Add a constant on the Blog account that provides its total size.
    impl BlogState {
        const LEN: usize = DISCRIMINATOR_LENGTH
    + PUBLIC_KEY_LENGTH // Public key of the BlogAccount
    + PUBLIC_KEY_LENGTH //PublicKey of the Authority, aka User
    + PUBLIC_KEY_LENGTH //Public key of the Owner, aka PROGRAM_ID
    + BUMP_LENGTH
    + POST_COUNT_LENGTH;  
    }


   
    #[account]
    pub struct Post {
        pub blog: Pubkey,
        pub author: Pubkey,
        pub slug : String,
        pub bump : u8,
        pub title : String,
        pub content : String,
        pub timestamp: i64,
        pub author_name : String,
        
    }

    //4. Add a constant on the Post account that provides its total size
    impl Post {
        const LEN : usize = DISCRIMINATOR_LENGTH 
        + PUBLIC_KEY_LENGTH // Public Key of the PostAccount
        + PUBLIC_KEY_LENGTH // Public Key of the Authority, i.e AUTHOR( or USER )
        + PUBLIC_KEY_LENGTH // Public Key of the BlogAccount
        + BUMP_LENGTH
        + TIMESTAMP_LENGTH // Unix Timestamp Max Length
        + STRING_LENGTH_PREFIX
        + SLUG_LENGTH // MAX PERMISSIBLE SLUG LENGTH
        + STRING_LENGTH_PREFIX 
        + MAX_AUTHOR_LENGTH // MAX PERMISSIBLE AUTHOR'S NAME'S LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_TITLE_LENGTH  // THIS IS THE POST'S TITLE'S LENGTH
        + STRING_LENGTH_PREFIX
        + MAX_CONTENT_LENGTH; // THIS IS THE POST'S CONTENT'S LENGTH 
    }


    #[error]
    pub enum ErrorCode {
        #[msg("You are not authorized to perform this action.")]
        Unauthorized,
        #[msg("The provided BlogPost should be 5000 characters long maximum.")]
        ContentTooLong,
        #[msg("Title cannot be more than 50 characters And Slug cannot be more than 10 characters")]
        SlugOrTitleTooLong,
        #[msg("Author Name cannot be more than 32 characters")]
        AuthorNameTooLong

    }
}

