// const AiBot = require('../entity/module/aibot.model');
// const BotKnowledgeService = require('../services/botknowledge.service');
// const AiBotService = require('../services/aibot.service');

// // 🧩 Mock các phụ thuộc
// jest.mock('../entity/module/aibot.model');
// jest.mock('../services/botknowledge.service');

// describe('AiBotService', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('createBot', () => {
//     it('should create and save a new bot', async () => {
//       const fakeData = { name: 'Test Bot', owner_id: 'user123' };
//       const savedBot = { _id: '1', ...fakeData };

//       AiBot.prototype.save = jest.fn().mockResolvedValue(savedBot);

//       const result = await AiBotService.createBot(fakeData);

//       expect(AiBot.prototype.save).toHaveBeenCalled();
//       expect(result).toEqual(savedBot);
//     });
//   });

//   describe('getBotsByOwner', () => {
//     it('should return bots of a specific owner', async () => {
//       const mockBots = [
//         { _id: '1', owner_id: 'user123', name: 'Bot 1' },
//         { _id: '2', owner_id: 'user123', name: 'Bot 2' }
//       ];

//       AiBot.find.mockResolvedValue(mockBots);

//       const result = await AiBotService.getBotsByOwner('user123');

//       expect(AiBot.find).toHaveBeenCalledWith({ owner_id: 'user123' });
//       expect(result).toEqual(mockBots);
//     });
//   });

//   describe('getBotById', () => {
//     it('should return bot details with knowledge', async () => {
//       const mockBot = {
//         _id: '1',
//         name: 'AI Helper',
//         description: 'Chat assistant',
//         status: 'active',
//         owner_id: 'user123'
//       };

//       const mockKnowledge = [
//         { title: 'Intro', content: 'Hello', tags: ['welcome'] },
//         { title: 'Help', content: 'Support info', tags: ['faq'] }
//       ];

//       AiBot.findById.mockResolvedValue(mockBot);
//       BotKnowledgeService.getKnowledgeByBotId.mockResolvedValue(mockKnowledge);

//       const result = await AiBotService.getBotById('1');

//       expect(AiBot.findById).toHaveBeenCalledWith('1');
//       expect(BotKnowledgeService.getKnowledgeByBotId).toHaveBeenCalledWith('1');
//       expect(result.knowledge).toHaveLength(2);
//       expect(result.name).toBe('AI Helper');
//     });
//   });

//   describe('updateBot', () => {
//     it('should update bot successfully', async () => {
//       const mockBot = { _id: '1', name: 'Updated Bot' };
//       AiBot.findByIdAndUpdate.mockResolvedValue(mockBot);

//       const result = await AiBotService.updateBot('1', { name: 'Updated Bot' });

//       expect(AiBot.findByIdAndUpdate).toHaveBeenCalledWith('1', { name: 'Updated Bot' }, { new: true });
//       expect(result).toEqual(mockBot);
//     });
//   });

//   describe('deleteBot', () => {
//     it('should delete bot successfully', async () => {
//       const mockBot = { _id: '1', name: 'Deleted Bot' };
//       AiBot.findByIdAndDelete.mockResolvedValue(mockBot);

//       const result = await AiBotService.deleteBot('1');

//       expect(AiBot.findByIdAndDelete).toHaveBeenCalledWith('1');
//       expect(result).toEqual(mockBot);
//     });
//   });

//   describe('testHandleMessage', () => {
//     it('should return bot response when found', async () => {
//       const mockBot = { _id: '1', name: 'EchoBot' };
//       AiBot.findById.mockResolvedValue(mockBot);

//       const result = await AiBotService.testHandleMessage('1', 'Hello!');

//       expect(AiBot.findById).toHaveBeenCalledWith('1');
//       expect(result).toBe('Bot (EchoBot) received: Hello!');
//     });

//     it('should throw error if bot not found', async () => {
//       AiBot.findById.mockResolvedValue(null);

//       await expect(AiBotService.testHandleMessage('999', 'Hi')).rejects.toThrow('Bot not found');
//     });
//   });

//   describe('handleMessage', () => {
//     it('should return message processed by bot', async () => {
//       const bot = { name: 'SimpleBot' };
//       const result = await AiBotService.handleMessage(bot, 'Ping');
//       expect(result).toBe('Bot (SimpleBot) received: Ping');
//     });
//   });
// });
