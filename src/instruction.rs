use crate::ProgramError;
use borsh::{BorshDeserialize, BorshSerialize};
use std::convert::TryInto;
use solana_program::{
    instruction::{AccountMeta, Instruction},
    program_option::COption,
    pubkey::Pubkey,
    sysvar,
};

// #[derive(Debug)]
// #[derive(BorshSerialize, BorshDeserialize)]
// pub enum SumInstruction {
//     SayHello,
//     SayBye,
// }

// impl HelloInstruction {
//        pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
//             let (&tag, rest) = input
//                 .split_first()
//                 .ok_or(ProgramError::InvalidInstructionData)?;
//             //msg!("tag data {}",&tag);
    
//             Ok(match tag {
//                 0 => HelloInstruction::SayHello,
//                 1 => HelloInstruction::SayBye,
//                 _ => return Err(ProgramError::InvalidInstructionData),
//             })
//         }
   
//         pub fn unpack_amount(input: &[u8]) -> Result<u64, ProgramError> {
//             let amount = input
//                 .get(..8)
//                 .and_then(|slice| slice.try_into().ok())
//                 .map(u64::from_le_bytes)
//                 .ok_or(ProgramError::InvalidInstructionData)?;
//             Ok(amount)
//         }
//     }

#[repr(C)]
#[derive(Clone, Debug, PartialEq)]
#[derive(BorshSerialize, BorshDeserialize)]
pub enum SumInstruction {
    
    sum_account 
    {
      
        input_a: u32,
        input_b: u32,
        program2_id: u32,
    }
}

impl SumInstruction {

    pub fn pack(&self) -> Vec<u8> {
        let mut buf = Vec::with_capacity(30);
         buf.push(10);
         buf.push(20);
         buf.push(30);
    
         return buf;
    
    }
    
}

pub fn initialize_sum_account(
    invoke_program_id: &Pubkey,
    acc1: &Pubkey,
    acc2: &Pubkey,
   
) -> Result<Instruction, ProgramError> {
    
    let data = SumInstruction::sum_account {
        input_a: 10,
        input_b: 20,
        program2_id: 30,
    }
    .pack();
    let accounts = vec![
        AccountMeta::new(*acc1, false),
        AccountMeta::new(*acc2, false),
    ];

    Ok(Instruction {
        program_id: *invoke_program_id,
        accounts,
        data,
    })
}

