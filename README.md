# Discord-Poll-Bot

Repo for discord bot that manages polls

# Commands

1. `!poll "Question" "Option 1" "Option2" "Option 3"` (There can be any number of options. There just has to be a space between them and they have to be in quotes)

2. `!evaluatePoll` Evaluate the poll with all the responses and send the results in the channel.

3. `!poll option` Give a response to the poll. The option can be A, B, C etc. Doing the same command again will enable you to send `y` or `n` depending on whether you would like change to your response or not.

4. `!poll add "option"` In case you realise you missed a option. Just make sure its between quotes and the new option will be added!

NOTE : Commands 1 and 2 can only be used by specific roles you choose. Add all the role IDs you wish for to be able to use the command with a space in between each of them in the .env file
