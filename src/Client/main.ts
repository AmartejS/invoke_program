/**
 * Hello world
 */

 import {
    establishConnection,
    establishPayer,
    checkProgram,
    InvokeProgram,
    reportGreetings,
    
  } from './client';
  
  async function main() {
    console.log("Starting the invoke program...");
  
    // Establish connection to the cluster
    await establishConnection();
  
    // Determine who pays for the fees
    await establishPayer();
  
    // Check if the program has been deployed
    await checkProgram();
  
    // Say hello to an account
    await InvokeProgram();
  
    // Find out how many times that account has been greeted
    await reportGreetings();
  
    console.log('Success');
  }
  
  main().then(
    () => process.exit(),
    err => {
      console.error(err);
      process.exit(-1);
    },
  );