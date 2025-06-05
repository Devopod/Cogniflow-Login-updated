import axios from 'axios';

/**
 * AI Invoice Assistant Service
 * Provides AI-powered features for invoice generation and insights.
 */
export class AIInvoiceAssistant {
  private openAIEndpoint: string;
  private openAIKey: string;

  constructor() {
    this.openAIEndpoint = process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
    this.openAIKey = process.env.OPENAI_API_KEY || '';
  }

  private async callOpenAI(prompt: string): Promise<string> {
    try {
      const response = await axios.post(this.openAIEndpoint, {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }, {
        headers: {
          'Authorization': `Bearer ${this.openAIKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content.trim();
      }
      return '';
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Auto-generate invoice description from brief notes
   */
  async generateInvoiceDescription(notes: string): Promise<string> {
    const prompt = `Generate a professional invoice item description based on the following notes:\n${notes}`;
    return this.callOpenAI(prompt);
  }

  /**
   * Smart pricing suggestions based on market data
   */
  async suggestPricing(productName: string, currentPrice: number): Promise<string> {
    const prompt = `Suggest a competitive price for the product "${productName}" given the current price is $${currentPrice}. Consider market trends and competitor pricing.`;
    return this.callOpenAI(prompt);
  }

  /**
   * Predict payment delays and suggest actions
   */
  async predictPaymentDelay(clientName: string, paymentHistorySummary: string): Promise<string> {
    const prompt = `Based on the payment history summary below for client "${clientName}", predict the likelihood of payment delays and suggest actions to mitigate risks:\n${paymentHistorySummary}`;
    return this.callOpenAI(prompt);
  }

  /**
   * Auto-categorize expenses and generate insights
   */
  async categorizeExpenses(expenseList: string): Promise<string> {
    const prompt = `Categorize the following expenses into appropriate categories and provide insights:\n${expenseList}`;
    return this.callOpenAI(prompt);
  }
}

export const aiInvoiceAssistant = new AIInvoiceAssistant();
