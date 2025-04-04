import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSlackLunchStatus, getSlackReportStatus, getSlackUpdateStatus } from '@/lib/slack';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const availableFunctions = {
	getSlackLunchStatus: {
		name: "getSlackLunchStatus",
		description: "Get the lunch status from Slack for a specific channel",
		parameters: {
			type: "object",
			properties: {
				channelName: {
					type: "string",
					description: "The name of the Slack channel to check (without the # symbol)",
				},
				timeframe: {
					type: "string",
					enum: ["today", "yesterday", "this_week"],
					description: "The timeframe to check for lunch status messages (default: today)",
					default: "today"
				}
			},
			required: ["channelName"],
		},
		examples: [
			{
				channelName: "general",
				timeframe: "today"
			}
		],
		additionalInformation: "This function checks if users in the specified Slack channel have posted #lunchstart and #lunchend messages. For lunch end, both #lunchend and #lunchover tags are recognized as equivalent."
	},
	getSlackUpdateStatus: {
		name: "getSlackUpdateStatus",
		description: "Get a list of users in a Slack channel who have posted #update messages with their content",
		parameters: {
			type: "object",
			properties: {
				channelName: {
					type: "string",
					description: "The name of the Slack channel to check (without the # symbol)"
				},
				timeframe: {
					type: "string",
					enum: ["today", "yesterday", "this_week"],
					description: "The timeframe to check for update messages (default: today)"
				}
			},
			required: ["channelName"]
		},
		examples: [
			{
				channelName: "general",
				timeframe: "today"
			}
		],
		additionalInformation: "This function checks if users in the specified Slack channel have posted #update messages and returns the content of those messages."
	},
	getSlackReportStatus: {
		name: "getSlackReportStatus",
		description: "Get a list of users in a Slack channel who have posted #report messages with their content",
		parameters: {
			type: "object",
			properties: {
				channelName: {
					type: "string",
					description: "The name of the Slack channel to check (without the # symbol)"
				},
				timeframe: {
					type: "string",
					enum: ["today", "yesterday", "this_week"],
					description: "The timeframe to check for report messages (default: today)"
				}
			},
			required: ["channelName"]
		},
		examples: [
			{
				channelName: "general",
				timeframe: "today"
			}
		],
		additionalInformation: "This function checks if users in the specified Slack channel have posted #report messages and returns the content of those reports."
	},
};

export async function POST(req: Request) {
	try {
		const { message } = await req.json();

		if (!message) {
			return NextResponse.json(
				{ error: 'Message is required' },
				{ status: 400 }
			);
		}

		let systemPrompt = `You are a helpful AI assistant. The user has uploaded documents but their question doesn't match any specific content in those documents. 
        Please respond in a helpful way, suggesting that they:
        1. Try rephrasing their question
        2. Ask about specific topics or sections they're interested in
        3. Share what they're looking for, and you can help guide them to the right questions
        
        Be friendly and encouraging in your response.
    
        
        If the user asks about Slack lunch status tracking, use the getSlackLunchStatus function to help them.
        
        If the user asks about Slack update status tracking, use the getSlackUpdateStatus function to help them.
        
        If the user asks about Slack report status tracking, use the getSlackReportStatus function to help them.`;

		const completion = await openai.chat.completions.create({
			model: 'gpt-4o',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: message },
			],
			temperature: 0.7,
			max_tokens: 500,
			tools: [
				{
					type: "function",
					function: availableFunctions.getSlackLunchStatus,
				},
				{
					type: "function",
					function: availableFunctions.getSlackUpdateStatus,
				},
				{
					type: "function",
					function: availableFunctions.getSlackReportStatus,
				},
			],
			tool_choice: "auto",
		});

		const responseMessage = completion.choices[0].message;

		const toolCalls = responseMessage.tool_calls;
		if (toolCalls) {
			console.log('\n=== Function Call Detected ===');

			for (const toolCall of toolCalls) {
				if (toolCall.type === 'function' && toolCall.function.name === 'getSlackLunchStatus') {
					const functionArgs = JSON.parse(toolCall.function.arguments);
					const channelName = functionArgs.channelName;
					const timeframe = functionArgs.timeframe || 'today';

					console.log(`Function call: getSlackLunchStatus(${channelName}, ${timeframe})`);

					try {
						if (!process.env.SLACK_BOT_TOKEN) {
							return NextResponse.json({
								content: `I was unable to check the lunch status for #${channelName}. The Slack bot token is not configured.`,
								error: 'SLACK_BOT_TOKEN is not set in environment variables'
							});
						}

						const slackData = await getSlackLunchStatus(
							channelName,
							timeframe as "today" | "yesterday" | "this_week"
						);

						return NextResponse.json({
							content: null,
							functionCall: {
								name: 'getSlackLunchStatus',
								arguments: { channelName, timeframe },
								result: slackData
							}
						});

					} catch (error) {
						console.error('Error in getSlackLunchStatus function call:', error);

						return NextResponse.json({
							content: `I encountered an error checking lunch status for #${channelName}: Channel #${channelName} not found. Please check if the channel exists and the bot has been added to it.`,
							error: `Channel #${channelName} not found. Please check if the channel exists and the bot has been added to it.`
						}, { status: 200 });
					}
				}

				else if (toolCall.type === 'function' && toolCall.function.name === 'getSlackUpdateStatus') {
					const functionArgs = JSON.parse(toolCall.function.arguments);
					const channelName = functionArgs.channelName;
					const timeframe = functionArgs.timeframe || 'today';

					console.log(`Function call: getSlackUpdateStatus(${channelName}, ${timeframe})`);

					try {
						if (!process.env.SLACK_BOT_TOKEN) {
							return NextResponse.json({
								content: `I was unable to check the update status for #${channelName}. The Slack bot token is not configured.`,
								error: 'SLACK_BOT_TOKEN is not set in environment variables'
							});
						}

						const slackData = await getSlackUpdateStatus(
							channelName,
							timeframe as "today" | "yesterday" | "this_week"
						);

						return NextResponse.json({
							content: null,
							functionCall: {
								name: 'getSlackUpdateStatus',
								arguments: { channelName, timeframe },
								result: slackData
							}
						});

					} catch (error) {
						console.error('Error in getSlackUpdateStatus function call:', error);

						return NextResponse.json({
							content: `I encountered an error checking update status for #${channelName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
							error: error instanceof Error ? error.message : 'Unknown error'
						}, { status: 200 });
					}
				}

				else if (toolCall.type === 'function' && toolCall.function.name === 'getSlackReportStatus') {
					const functionArgs = JSON.parse(toolCall.function.arguments);
					const channelName = functionArgs.channelName;
					const timeframe = functionArgs.timeframe || 'today';

					console.log(`Function call: getSlackReportStatus(${channelName}, ${timeframe})`);

					try {
						if (!process.env.SLACK_BOT_TOKEN) {
							return NextResponse.json({
								content: `I was unable to check the report status for #${channelName}. The Slack bot token is not configured.`,
								error: 'SLACK_BOT_TOKEN is not set in environment variables'
							});
						}

						const slackData = await getSlackReportStatus(
							channelName,
							timeframe as "today" | "yesterday" | "this_week"
						);

						return NextResponse.json({
							content: null,
							functionCall: {
								name: 'getSlackReportStatus',
								arguments: { channelName, timeframe },
								result: slackData
							}
						});

					} catch (error) {
						console.error('Error in getSlackReportStatus function call:', error);

						return NextResponse.json({
							content: `I encountered an error checking report status for #${channelName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
							error: error instanceof Error ? error.message : 'Unknown error'
						}, { status: 200 });
					}
				}
			}
		}

		console.log('\n=== OpenAI Response ===');
		console.log('Response length:', responseMessage.content?.length);
		console.log('Response preview:', responseMessage.content?.substring(0, 200) + '...');

		return NextResponse.json({
			content: responseMessage.content,
		});
	} catch (error) {
		console.error('Error in chat API:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Failed to process the request' },
			{ status: 500 }
		);
	}
}