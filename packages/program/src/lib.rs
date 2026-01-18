use anchor_lang::prelude::*;

declare_id!("VanishXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod vanish_program {
    use super::*;

    /// Create a new repository
    pub fn create_repo(
        ctx: Context<CreateRepo>,
        name: String,
        description: String,
        is_private: bool,
    ) -> Result<()> {
        require!(name.len() <= 64, VanishError::NameTooLong);
        require!(description.len() <= 256, VanishError::DescriptionTooLong);
        require!(!name.is_empty(), VanishError::NameEmpty);

        let repo = &mut ctx.accounts.repository;
        let clock = Clock::get()?;

        repo.owner = ctx.accounts.owner.key();
        repo.name = name;
        repo.description = description;
        repo.is_private = is_private;
        repo.created_at = clock.unix_timestamp;
        repo.updated_at = clock.unix_timestamp;
        repo.head_commit = String::new();
        repo.ipfs_cid = String::new();
        repo.stars = 0;
        repo.bump = ctx.bumps.repository;

        emit!(RepoCreated {
            owner: repo.owner,
            name: repo.name.clone(),
            is_private,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Update repository with new commit and IPFS CID
    pub fn push_update(
        ctx: Context<PushUpdate>,
        head_commit: String,
        ipfs_cid: String,
    ) -> Result<()> {
        require!(head_commit.len() == 40, VanishError::InvalidCommitHash);
        require!(ipfs_cid.len() <= 64, VanishError::InvalidIpfsCid);

        let repo = &mut ctx.accounts.repository;
        let clock = Clock::get()?;

        repo.head_commit = head_commit.clone();
        repo.ipfs_cid = ipfs_cid.clone();
        repo.updated_at = clock.unix_timestamp;

        emit!(RepoPushed {
            owner: repo.owner,
            name: repo.name.clone(),
            head_commit,
            ipfs_cid,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Add a collaborator to a repository
    pub fn add_collaborator(
        ctx: Context<AddCollaborator>,
        collaborator: Pubkey,
        can_push: bool,
    ) -> Result<()> {
        let collab = &mut ctx.accounts.collaborator_account;
        let clock = Clock::get()?;

        collab.repository = ctx.accounts.repository.key();
        collab.user = collaborator;
        collab.can_push = can_push;
        collab.added_at = clock.unix_timestamp;
        collab.bump = ctx.bumps.collaborator_account;

        emit!(CollaboratorAdded {
            repository: ctx.accounts.repository.key(),
            collaborator,
            can_push,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Remove a collaborator from a repository
    pub fn remove_collaborator(_ctx: Context<RemoveCollaborator>) -> Result<()> {
        // Account will be closed automatically via close constraint
        Ok(())
    }

    /// Star a repository
    pub fn star_repo(ctx: Context<StarRepo>) -> Result<()> {
        let star = &mut ctx.accounts.star_account;
        let repo = &mut ctx.accounts.repository;
        let clock = Clock::get()?;

        star.user = ctx.accounts.user.key();
        star.repository = ctx.accounts.repository.key();
        star.starred_at = clock.unix_timestamp;
        star.bump = ctx.bumps.star_account;

        repo.stars = repo.stars.checked_add(1).unwrap_or(repo.stars);

        emit!(RepoStarred {
            user: star.user,
            repository: star.repository,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Unstar a repository
    pub fn unstar_repo(ctx: Context<UnstarRepo>) -> Result<()> {
        let repo = &mut ctx.accounts.repository;
        repo.stars = repo.stars.saturating_sub(1);
        // Star account will be closed automatically
        Ok(())
    }

    /// Transfer repository ownership
    pub fn transfer_ownership(ctx: Context<TransferOwnership>, new_owner: Pubkey) -> Result<()> {
        let repo = &mut ctx.accounts.repository;
        let old_owner = repo.owner;

        repo.owner = new_owner;

        emit!(OwnershipTransferred {
            repository: ctx.accounts.repository.key(),
            old_owner,
            new_owner,
        });

        Ok(())
    }

    /// Delete a repository
    pub fn delete_repo(_ctx: Context<DeleteRepo>) -> Result<()> {
        // Account will be closed automatically via close constraint
        Ok(())
    }
}

// ============================================================================
// Accounts
// ============================================================================

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateRepo<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = Repository::SPACE,
        seeds = [b"repo", owner.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub repository: Account<'info, Repository>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PushUpdate<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"repo", owner.key().as_ref(), repository.name.as_bytes()],
        bump = repository.bump,
        has_one = owner
    )]
    pub repository: Account<'info, Repository>,
}

#[derive(Accounts)]
#[instruction(collaborator: Pubkey)]
pub struct AddCollaborator<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"repo", owner.key().as_ref(), repository.name.as_bytes()],
        bump = repository.bump,
        has_one = owner
    )]
    pub repository: Account<'info, Repository>,

    #[account(
        init,
        payer = owner,
        space = Collaborator::SPACE,
        seeds = [b"collab", repository.key().as_ref(), collaborator.as_ref()],
        bump
    )]
    pub collaborator_account: Account<'info, Collaborator>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveCollaborator<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"repo", owner.key().as_ref(), repository.name.as_bytes()],
        bump = repository.bump,
        has_one = owner
    )]
    pub repository: Account<'info, Repository>,

    #[account(
        mut,
        close = owner,
        seeds = [b"collab", repository.key().as_ref(), collaborator_account.user.as_ref()],
        bump = collaborator_account.bump
    )]
    pub collaborator_account: Account<'info, Collaborator>,
}

#[derive(Accounts)]
pub struct StarRepo<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub repository: Account<'info, Repository>,

    #[account(
        init,
        payer = user,
        space = Star::SPACE,
        seeds = [b"star", user.key().as_ref(), repository.key().as_ref()],
        bump
    )]
    pub star_account: Account<'info, Star>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UnstarRepo<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub repository: Account<'info, Repository>,

    #[account(
        mut,
        close = user,
        seeds = [b"star", user.key().as_ref(), repository.key().as_ref()],
        bump = star_account.bump
    )]
    pub star_account: Account<'info, Star>,
}

#[derive(Accounts)]
pub struct TransferOwnership<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"repo", owner.key().as_ref(), repository.name.as_bytes()],
        bump = repository.bump,
        has_one = owner
    )]
    pub repository: Account<'info, Repository>,
}

#[derive(Accounts)]
pub struct DeleteRepo<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        close = owner,
        seeds = [b"repo", owner.key().as_ref(), repository.name.as_bytes()],
        bump = repository.bump,
        has_one = owner
    )]
    pub repository: Account<'info, Repository>,
}

// ============================================================================
// State
// ============================================================================

#[account]
pub struct Repository {
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub is_private: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub head_commit: String,
    pub ipfs_cid: String,
    pub stars: u64,
    pub bump: u8,
}

impl Repository {
    pub const SPACE: usize = 8  // discriminator
        + 32  // owner
        + 4 + 64  // name (string)
        + 4 + 256  // description (string)
        + 1  // is_private
        + 8  // created_at
        + 8  // updated_at
        + 4 + 40  // head_commit (string)
        + 4 + 64  // ipfs_cid (string)
        + 8  // stars
        + 1; // bump
}

#[account]
pub struct Collaborator {
    pub repository: Pubkey,
    pub user: Pubkey,
    pub can_push: bool,
    pub added_at: i64,
    pub bump: u8,
}

impl Collaborator {
    pub const SPACE: usize = 8  // discriminator
        + 32  // repository
        + 32  // user
        + 1  // can_push
        + 8  // added_at
        + 1; // bump
}

#[account]
pub struct Star {
    pub user: Pubkey,
    pub repository: Pubkey,
    pub starred_at: i64,
    pub bump: u8,
}

impl Star {
    pub const SPACE: usize = 8  // discriminator
        + 32  // user
        + 32  // repository
        + 8  // starred_at
        + 1; // bump
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct RepoCreated {
    pub owner: Pubkey,
    pub name: String,
    pub is_private: bool,
    pub timestamp: i64,
}

#[event]
pub struct RepoPushed {
    pub owner: Pubkey,
    pub name: String,
    pub head_commit: String,
    pub ipfs_cid: String,
    pub timestamp: i64,
}

#[event]
pub struct CollaboratorAdded {
    pub repository: Pubkey,
    pub collaborator: Pubkey,
    pub can_push: bool,
    pub timestamp: i64,
}

#[event]
pub struct RepoStarred {
    pub user: Pubkey,
    pub repository: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct OwnershipTransferred {
    pub repository: Pubkey,
    pub old_owner: Pubkey,
    pub new_owner: Pubkey,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum VanishError {
    #[msg("Repository name is too long (max 64 characters)")]
    NameTooLong,

    #[msg("Repository description is too long (max 256 characters)")]
    DescriptionTooLong,

    #[msg("Repository name cannot be empty")]
    NameEmpty,

    #[msg("Invalid commit hash (must be 40 characters)")]
    InvalidCommitHash,

    #[msg("Invalid IPFS CID")]
    InvalidIpfsCid,

    #[msg("Unauthorized")]
    Unauthorized,
}
