import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const availableFunctions = {
	setTheme: {
		name: "setTheme",
		description: "Set the theme of the application to light or dark mode",
		parameters: {
			type: "object",
			properties: {
				theme: {
					type: "string",
					enum: ["light", "dark"],
					description: "The theme to set for the application",
				},
			},
			required: ["theme"],
		},
	},

	createServer: {
		name: "createServer",
		description: "Create a server with a name and image url",
		parameters: {
			type: "object",
			properties: {
				name: {
					type: "string",
					description: "The name of the server",
				},
				imageUrl: {
					type: "string",
					description: "The image url of the server",
				},
			},
			required: ["name", "imageUrl"],
		},
	},

	updateServer: {
		name: "updateServer",
		description: "Update the server with a name and image url",
		parameters: {
			type: "object",
			properties: {
				name: {
					type: "string",
					description: "The name of the server",
				},
				imageUrl: {
					type: "string",
					description: "The image url of the server",
				},
			},
			required: ["name", "imageUrl"],
		},
	},

	deleteServer: {
		name: "deleteServer",
		description: "Delete the server if delete keyword and server keyword is used",
	},

	getMembers: {
		name: "getMembers",
		description: "Get or fetch or show the members of the server",
		parameters: {
			type: "object",
			properties: {
				serverId: {
					type: "string",
					description: "The id of the server to get the members",
				},
			},
		},
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

		let systemPrompt = '';

		systemPrompt = `You are a helpful AI assistant. Provide clear, concise, and accurate answers to the user's questions. 
    If you're not sure about something, say so. Be friendly and professional in your responses.
    
    You also have the ability to control the theme of the application. If the user asks to change the theme (light/dark), use the setTheme function.
    
    You also have the ability to create a server. If the user asks to create a server, use the createServer function using the name and image url provided by the user.

    You also have the ability to update or change the name and image of a server. If the user asks to update or change the name and image of a server, use the updateServer function using the name and image url provided by the user.

    You also have the ability to delete or remove a server. If the user asks to delete or remove a server, use the deleteServer function

	you also have the ability to get information about the members in the server. If the user asks to get members in the server, use the getMembers function to fetch the information.

    You can only use one function at a time.
    `;

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
					function: availableFunctions.setTheme,
				},
				{
					type: "function",
					function: availableFunctions.createServer,
				},
				{
					type: "function",
					function: availableFunctions.updateServer,
				},
				{
					type: "function",
					function: availableFunctions.deleteServer,
				},
				{
					type: "function",
					function: availableFunctions.getMembers,
				},
			],
			tool_choice: "auto",
		});

		const responseMessage = completion.choices[0].message;

		// Check if the model wants to call a function
		const toolCalls = responseMessage.tool_calls;
		if (toolCalls) {
			console.log('\n=== Function Call Detected ===');

			for (const toolCall of toolCalls) {
				if (toolCall.type === 'function' && toolCall.function.name === 'setTheme') {
					const functionArgs = JSON.parse(toolCall.function.arguments);
					const theme = functionArgs.theme;

					console.log(`Function call: setTheme(${theme})`);

					// Return with function call information
					return NextResponse.json({
						content: responseMessage.content || "I'll change the theme for you.",
						functionCall: {
							name: 'setTheme',
							arguments: { theme }
						}
					});
				}

				else if (toolCall.type === 'function' && toolCall.function.name === 'createServer') {
					const functionArgs = JSON.parse(toolCall.function.arguments);
					const name = functionArgs.name;
					const imageUrl = functionArgs.imageUrl;

					console.log(`Function call: createServer(${name}, ${imageUrl})`);

					// Return with function call information
					return NextResponse.json({
						content: responseMessage.content || "I'll create a server for you.",
						functionCall: {
							name: 'createServer',
							arguments: { name, imageUrl }
						}
					});
				}

				else if (toolCall.type === 'function' && toolCall.function.name === 'updateServer') {
					const functionArgs = JSON.parse(toolCall.function.arguments);
					const name = functionArgs.name;
					const imageUrl = functionArgs.imageUrl;

					console.log(`Function call: updateServer(${name}, ${imageUrl})`);

					return NextResponse.json({
						content: responseMessage.content || "I'll update the server for you.",
						functionCall: {
							name: 'updateServer',
							arguments: { name, imageUrl }
						}
					});
				}

				else if (toolCall.type === 'function' && toolCall.function.name === 'deleteServer') {

					// Return with function call information
					return NextResponse.json({
						content: responseMessage.content || "I'll delete the server for you.",
						functionCall: {
							name: 'deleteServer',
						}
					});
				}

				else if (toolCall.type === 'function' && toolCall.function.name === 'getMembers') {
					const functionArgs = JSON.parse(toolCall.function.arguments);
					const serverId = functionArgs.serverId;

					console.log(`Function call: getMembers/ Return with function call information`)
					return NextResponse.json({
						content: responseMessage.content || "I'll get the members for you.",
						functionCall: {
							name: 'getMembers',
							arguments: { serverId },
						}
					});
				}
			}
		}

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