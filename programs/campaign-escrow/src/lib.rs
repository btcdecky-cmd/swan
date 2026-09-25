//! Swan Campaign Escrow — live Solana adoption ad protocol (Anchor)
//! ClaimReceipt PDA prevents double-pay per participant.

use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("SwanCmpEscrow1111111111111111111111111");

pub const CAMPAIGN_SEED: &[u8] = b"campaign";
pub const ESCROW_SEED: &[u8] = b"escrow";
pub const CLAIM_SEED: &[u8] = b"claim";

#[program]
pub mod campaign_escrow {
    use super::*;

    pub fn initialize_campaign(
        ctx: Context<InitializeCampaign>,
        campaign_id: [u8; 16],
        budget_lamports: u64,
        reward_per_completion: u64,
        max_completions: u32,
    ) -> Result<()> {
        require!(budget_lamports > 0, EscrowError::InvalidBudget);
        require!(reward_per_completion > 0, EscrowError::InvalidReward);
        require!(max_completions > 0, EscrowError::InvalidMax);

        let c = &mut ctx.accounts.campaign;
        c.bump = ctx.bumps.campaign;
        c.escrow_bump = ctx.bumps.escrow;
        c.advertiser = ctx.accounts.advertiser.key();
        c.campaign_id = campaign_id;
        c.budget_lamports = budget_lamports;
        c.spent_lamports = 0;
        c.reward_per_completion = reward_per_completion;
        c.max_completions = max_completions;
        c.completion_count = 0;
        c.status = CampaignStatus::Active as u8;
        c.authority = ctx.accounts.authority.key();

        let cpi = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.advertiser.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
            },
        );
        system_program::transfer(cpi, budget_lamports)?;
        Ok(())
    }

    pub fn pay_completion(ctx: Context<PayCompletion>) -> Result<()> {
        let c = &mut ctx.accounts.campaign;
        require!(c.status == CampaignStatus::Active as u8, EscrowError::NotActive);
        require!(c.completion_count < c.max_completions, EscrowError::MaxCompletions);
        require!(
            c.spent_lamports.saturating_add(c.reward_per_completion) <= c.budget_lamports,
            EscrowError::BudgetExhausted
        );

        let reward = c.reward_per_completion;
        let campaign_key = c.key();
        let escrow_info = ctx.accounts.escrow.to_account_info();
        let participant_info = ctx.accounts.participant.to_account_info();
        **escrow_info.try_borrow_mut_lamports()? = escrow_info
            .lamports()
            .checked_sub(reward)
            .ok_or(EscrowError::BudgetExhausted)?;
        **participant_info.try_borrow_mut_lamports()? = participant_info
            .lamports()
            .checked_add(reward)
            .ok_or(EscrowError::Overflow)?;

        c.spent_lamports = c.spent_lamports.saturating_add(reward);
        c.completion_count = c.completion_count.saturating_add(1);

        let claim = &mut ctx.accounts.claim;
        claim.campaign = campaign_key;
        claim.participant = ctx.accounts.participant.key();
        claim.reward_lamports = reward;
        claim.bump = ctx.bumps.claim;
        Ok(())
    }

    pub fn pause(ctx: Context<AdminCampaign>) -> Result<()> {
        require_keys_eq!(ctx.accounts.advertiser.key(), ctx.accounts.campaign.advertiser, EscrowError::Unauthorized);
        ctx.accounts.campaign.status = CampaignStatus::Paused as u8;
        Ok(())
    }

    pub fn end_and_refund(ctx: Context<AdminCampaign>) -> Result<()> {
        require_keys_eq!(ctx.accounts.advertiser.key(), ctx.accounts.campaign.advertiser, EscrowError::Unauthorized);
        let c = &mut ctx.accounts.campaign;
        let remaining = c.budget_lamports.saturating_sub(c.spent_lamports);
        if remaining > 0 {
            let escrow_info = ctx.accounts.escrow.to_account_info();
            let adv_info = ctx.accounts.advertiser.to_account_info();
            **escrow_info.try_borrow_mut_lamports()? = escrow_info.lamports().checked_sub(remaining).ok_or(EscrowError::BudgetExhausted)?;
            **adv_info.try_borrow_mut_lamports()? = adv_info.lamports().checked_add(remaining).ok_or(EscrowError::Overflow)?;
        }
        c.status = CampaignStatus::Ended as u8;
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum CampaignStatus {
    Draft = 0,
    PendingReview = 1,
    Active = 2,
    Paused = 3,
    Ended = 4,
}

#[account]
pub struct CampaignAccount {
    pub bump: u8,
    pub escrow_bump: u8,
    pub advertiser: Pubkey,
    pub authority: Pubkey,
    pub campaign_id: [u8; 16],
    pub budget_lamports: u64,
    pub spent_lamports: u64,
    pub reward_per_completion: u64,
    pub max_completions: u32,
    pub completion_count: u32,
    pub status: u8,
}

#[account]
pub struct ClaimReceipt {
    pub campaign: Pubkey,
    pub participant: Pubkey,
    pub reward_lamports: u64,
    pub bump: u8,
}

#[derive(Accounts)]
#[instruction(campaign_id: [u8; 16])]
pub struct InitializeCampaign<'info> {
    #[account(mut)]
    pub advertiser: Signer<'info>,
    /// CHECK: stored on campaign
    pub authority: UncheckedAccount<'info>,
    #[account(
        init,
        payer = advertiser,
        space = 8 + 1 + 1 + 32 + 32 + 16 + 8 + 8 + 8 + 4 + 4 + 1,
        seeds = [CAMPAIGN_SEED, campaign_id.as_ref()],
        bump
    )]
    pub campaign: Account<'info, CampaignAccount>,
    /// CHECK: escrow PDA
    #[account(mut, seeds = [ESCROW_SEED, campaign.key().as_ref()], bump)]
    pub escrow: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PayCompletion<'info> {
    pub authority: Signer<'info>,
    #[account(mut, constraint = authority.key() == campaign.authority @ EscrowError::Unauthorized)]
    pub campaign: Account<'info, CampaignAccount>,
    /// CHECK: escrow
    #[account(mut, seeds = [ESCROW_SEED, campaign.key().as_ref()], bump = campaign.escrow_bump)]
    pub escrow: AccountInfo<'info>,
    /// CHECK: recipient
    #[account(mut)]
    pub participant: AccountInfo<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 8 + 1,
        seeds = [CLAIM_SEED, campaign.key().as_ref(), participant.key().as_ref()],
        bump
    )]
    pub claim: Account<'info, ClaimReceipt>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminCampaign<'info> {
    #[account(mut)]
    pub advertiser: Signer<'info>,
    #[account(mut)]
    pub campaign: Account<'info, CampaignAccount>,
    /// CHECK: escrow
    #[account(mut, seeds = [ESCROW_SEED, campaign.key().as_ref()], bump = campaign.escrow_bump)]
    pub escrow: AccountInfo<'info>,
}

#[error_code]
pub enum EscrowError {
    #[msg("Campaign is not active")]
    NotActive,
    #[msg("Max completions reached")]
    MaxCompletions,
    #[msg("Budget exhausted")]
    BudgetExhausted,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid budget")]
    InvalidBudget,
    #[msg("Invalid reward")]
    InvalidReward,
    #[msg("Invalid max completions")]
    InvalidMax,
    #[msg("Arithmetic overflow")]
    Overflow,
}
