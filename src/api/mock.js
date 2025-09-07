export const createTransaction = async (data) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000, 3000));
    
    const reference = `GAIN_${data.ticketType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      reference,
      message: 'Transaction created successfully'
    };
  };
  
  export const verifyPayment = async (reference) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate successful payment
    return {
      status: 'success',
      message: 'Payment verified successfully'
    };
  };