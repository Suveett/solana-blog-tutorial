use self::id as program_id;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use std::str::from_utf8;

declare_id!("6JZCuw4DApw1gbwbHSyQUqxEoVtPhGsqADdKCere7cUn");

#[program]
pub mod solana_blog_tutorial {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, blog_account_bump: u8) -> ProgramResult {
        let blog = &mut ctx.accounts.blog_account;
        let authority = &mut ctx.accounts.authority;
        let clock = Clock::get().unwrap();

        blog.authority = *authority.key;
        blog.count = 0;
        blog.posts = Vec::new();
        //ctx.accounts.blog_account.bump = blog_account_bump;
        blog.bump = blog_account_bump;
        blog.owner = program_id();
        blog.timestamp = clock.unix_timestamp;

        Ok(())
    }

    pub fn make_post(ctx: Context<MakePost>, new_post: Vec<u8>) -> ProgramResult {
        let post = from_utf8(&new_post) // convert the array of bytes into a string slice
            .map_err(|err| {
                msg!("Invalid UTF-8, from byte {}", err.valid_up_to());
                ProgramError::InvalidInstructionData
            })?;
        msg!(post); // msg!() is a Solana macro that prints string slices to the program log, which we can grab from the transaction block data

        if post.chars().count() > 2052 {
            return Err(ErrorCode::ContentTooLong.into());
        }

        let blog = &mut ctx.accounts.blog_account;
        let authority = &mut ctx.accounts.authority;

        //Lets build a BlogStruct here.
        let new_blog = BlogStruct {
            blog: post.to_string(),
            user_address: *authority.to_account_info().key,
        };
        // // Anchor takes Care of all these below lines of Code:
        //     // Now to allow transactions we want only the authority to sign the transaction.
        //     if !authority.to_account_info().is_signer {
        //         msg!("creator_account should be signer");
        //         return Err(ProgramError::IncorrectProgramId);
        //     }

        //     // We want to write blog in the account owned by the program.
        //     if blog.owner != program_id() {
        //     msg!("This Blog Account isn't owned by Current Program");
        //     return Err(ProgramError::IncorrectProgramId);
        // }

        //      //Lets build a BlogStruct here.
        //      let new_blog = BlogStruct {
        //         blog : post.to_string(),
        //         user_address : *authority.to_account_info().key,
        //     };

        //     //We doubly check that user_address = Signer's pubkey
        //     if new_blog.user_address != *authority.to_account_info().key {
        //         msg!("You are not authorized to perform this action.");
        //         return Err(ErrorCode::Unauthorized.into());
        //     }

        //     let rent_exemption = Rent::get()?.minimum_balance(blog.to_account_info().data_len());
        //         if **blog.to_account_info().lamports.borrow() < rent_exemption {
        //         msg!("The balance of blog_account should be more than rent_exemption");
        //         return Err(ProgramError::InsufficientFunds);
        //         }

        //     new_blog.serialize(&mut &mut blog.to_account_info().data.borrow_mut()[..])?;
        blog.posts.push(new_blog);
        blog.count += 1;

        Ok(())
    }

    //Create a custom struct for us to work with.
    #[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
    pub struct BlogStruct {
        pub blog: String,
        pub user_address: Pubkey,
    }

    #[derive(Accounts)]
    #[instruction(blog_account_bump: u8)]
    pub struct Initialize<'info> {
        #[account(init, seeds = [b"hello".as_ref()], bump = blog_account_bump, payer = authority, space = BlogState::LEN)]
        blog_account: Account<'info, BlogState>,
        #[account(mut)]
        authority: Signer<'info>,
        #[account(address = system_program::ID)]
        system_program: Program<'info, System>,
    }

    //has_one = authority enforces the constraint again that MakePost.blog_account.authority == MakesPost.authority.key
    #[derive(Accounts)]
    
    pub struct MakePost<'info> {
        #[account(mut, seeds = [b"hello".as_ref()], bump = blog_account.bump, has_one = authority )]
        blog_account: Account<'info, BlogState>,
        #[account(mut)]
        authority: Signer<'info>,
    }

    #[account]
    // #[derive(Default)]
    pub struct BlogState {
        pub authority: Pubkey,
        pub count: u64,
        pub posts: Vec<BlogStruct>,
        pub bump: u8,
        pub owner: Pubkey,
        pub timestamp: i64,
    }

    // 2. Add some useful constants for sizing properties.

    const DISCRIMINATOR_LENGTH: usize = 8;
    const PUBLIC_KEY_LENGTH: usize = 32;
    const TIMESTAMP_LENGTH: usize = 8;
    const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
    const MAX_CONTENT_LENGTH: usize = 2000; // 2000 chars max as nobody would read such indordinately big blogs

    // 3. Add a constant on the Blog account that provides its total size.
    impl BlogState {
        const LEN: usize = DISCRIMINATOR_LENGTH
    + PUBLIC_KEY_LENGTH // Author.
    + TIMESTAMP_LENGTH // Timestamp.
    + STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH; // Content.
    }

    #[error]
    pub enum ErrorCode {
        #[msg("You are not authorized to perform this action.")]
        Unauthorized,
        #[msg("The provided Blog should be 2000 characters long maximum.")]
        ContentTooLong,
    }
}
