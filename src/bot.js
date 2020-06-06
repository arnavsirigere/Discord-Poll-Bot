require('dotenv').config();

const keepAlive = require('../server');
keepAlive();

const { Poll } = require('./poll'); // The Poll Class
let poll;
let usersToChangePoll = [];
let responses = {};

const Discord = require('discord.js');
const client = new Discord.Client();

client.login(process.env.BOT_TOKEN);

client.on('ready', () => console.log('Discord Bot Starting!'));

client.on('message', async (message) => {
  let guild = message.guild; // The guild this message was sent in
  // Check if this is the corect guild
  if (guild.id == process.env.GUILD_ID) {
    // Validate message author
    let validRoles = process.env.ROLE_IDs.split(' '); // All the roles which can use this command
    let authorId = message.author.id; // The id of the author of the message
    let user = guild.members.cache.get(authorId); // The user in the guild who used this command
    let userId = user.id; // Id of the member
    let userRoles = user._roles; // The roles of the user
    let validUser = false; // Can this user use the command?
    let content = message.content; // The content of the message
    let pollChannel = client.channels.cache.get(process.env.POLL_CHANNEL_ID); // The channel to send the poll stuff too
    // Validate if user can use the command
    for (let i = 0; i < userRoles.length; i++) {
      if (validRoles.includes(userRoles[i])) {
        validUser = true;
      }
    }

    let pollActivatorRegex = /^!poll\s".+"(\s".+"){2,}/i;
    let pollEvaluatorRegex = /^!evaluatePoll/i;
    if ((pollActivatorRegex.test(content) || pollEvaluatorRegex.test(content)) && !validUser) {
      await message.reply("Oops, dad told me you can't use this command!");
    }
    // Activate a poll if the user has the roles to do so
    if (validUser) {
      if (pollActivatorRegex.test(content)) {
        // Check if there is already a poll before creating one
        if (!poll) {
          console.log('Poll Activated');
          let options = content.split('"');
          options.shift(); // We don't want the question to be "!poll" !
          let ques = options[0]; // Remove the question of the poll from the options and store it
          options.splice(0, 1);
          options = options.filter((option) => /\w/.test(option)); // Filtering out some empty strings the splitting gives

          // Creating the poll
          poll = new Poll(ques, options);
          let pollMssg = `@everyone ${ques.toUpperCase()}?`;
          for (let i = 0; i < options.length; i++) {
            pollMssg += `\n${String.fromCharCode(i + 65)} - ${options[i].substr(0, 1).toUpperCase() + options[i].substr(1, options[i].length).toLowerCase()}`;
          }
          pollMssg += `\n\nTo participate in the poll, send ${'`!poll option`'}. The option can be A, B, C, etc`;
          await pollChannel.send(pollMssg);
        } else {
          await message.reply('There is already a ongoing poll!');
        }
      } else if (pollEvaluatorRegex.test(content)) {
        if (poll) {
          await message.channel.send('Evaluating . . .');
          let { results, maxVote } = poll.evaluate();
          // Has anyone responded?
          if (maxVote == 0) {
            await message.reply('No one has responded yet!');
          } else {
            // Get the response of each user
            let userIds = Object.keys(responses);
            let members = [];
            for (let i = 0; i < userIds.length; i++) {
              let id = userIds[i];
              let member = guild.members.cache.get(id).user.username; // Getting the username of the user
              // Collecting the response of the user
              let index = responses[id];
              if (!members[index]) {
                members[index] = [];
              }
              members[index].push(member);
            }
            // Send a message with the results of the poll with some highlighting 😊
            let ques = '`' + poll.ques + '?' + '`';
            let completionMssg = `@everyone The poll for ${ques} is complete!\nHere are the results - \n\n`;
            let keys = Object.keys(results);
            for (let i = 0; i < keys.length; i++) {
              let key = keys[i];
              let options = '`' + key + '`';
              let votes = '`' + results[key] + '`';
              completionMssg += `${options} - ${votes}` + (members[i] ? '' : '\n');
              if (members[i]) {
                completionMssg += '  [';
                for (let j = 0; j < members[i].length; j++) {
                  completionMssg += members[i][j];
                  if (j < members[i].length - 1) {
                    completionMssg += ', ';
                  }
                }
                completionMssg += ']\n';
              }
            }
            await pollChannel.send(completionMssg);
            poll = null; // Reset the poll so that a new one can be created later
          }
        } else {
          await message.reply("There isn't a ongoing poll!");
        }
      }
    }

    // Responding to the poll
    if (/^!poll/i.test(content) && !pollActivatorRegex.test(content)) {
      // Check if there is a ongoing poll
      if (poll) {
        let option = content.split(' ')[1].toUpperCase().charCodeAt(0) - 65; // What did the user choose?
        if (/!poll\s\w$/i.test(content) && option < poll.options.length) {
          // Check if user has already responded
          if (poll.entries.includes(userId)) {
            // Just in case the user adds another response which is the same
            let sameResponse = option == responses[userId];
            await message.reply(sameResponse ? 'You have already responded!' : 'You have already responded! Would you like to change your response? y/n');
            if (!sameResponse) {
              usersToChangePoll.push({ userId, response: option }); // Keep the changed response in mind
            }
          } else {
            poll.entries.push(userId); // Mark this user as responded
            // Notify the user of her/his response
            await message.reply(`Your response for "${poll.options[option]}" was recorded! 😃`);
            responses[userId] = option; // Keep track of the response incase the user wants to change it later
            poll.responses[option] = poll.responses[option] ? ++poll.responses[option] : 1; // Save that response
          }
        } else {
          await message.reply('Invalid response!');
        }
      } else {
        await message.reply("There isn't a current poll!");
      }
    }

    // Changing the response
    // Check if user wants to change the response
    let changeResponse = false;
    for (let i = 0; i < usersToChangePoll.length; i++) {
      if (usersToChangePoll[i].userId) {
        changeResponse = true;
      }
    }
    if (content.toLowerCase() == 'y' && changeResponse) {
      let userInstance = usersToChangePoll.filter((obj) => obj.userId == userId)[0]; // The data of the user who wanted to change the response
      let prevResponse = responses[userId]; // The previous response of the user before the user changed his mind
      poll.responses[prevResponse]--; // Remove the users response
      let newResponse = userInstance.response; // Get the users new response
      poll.responses[newResponse] = poll.responses[newResponse] ? ++poll.responses[newResponse] : 1; // Update the responses based on the new response
      usersToChangePoll.splice(usersToChangePoll.indexOf(userInstance), 1); // We are done and lets remove the user from our list of users willing to change the response
      await message.reply(`Your response was updated to "${poll.options[newResponse]}"!`); // Alert the user
      responses[userId] = newResponse; // Keep track of the response incase the user wants to change it again!
    } else if (content.toLowerCase() == 'n' && changeResponse) {
      let userInstance = usersToChangePoll.filter((obj) => obj.userId == userId)[0]; // The data of the user who might have wanted to change the response
      usersToChangePoll.splice(usersToChangePoll.indexOf(userInstance), 1); // We are done and lets remove the user from our list of users willing to change the response
    }
  }
});
