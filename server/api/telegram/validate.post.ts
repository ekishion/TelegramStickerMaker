import { telegramService } from '../../services/telegramService'
import { logger } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody(event)) ?? {}
    const botToken = typeof body?.botToken === 'string' ? body.botToken.trim() : ''

    if (!botToken) {
      throw createError({ statusCode: 400, message: 'Bot token is required' })
    }

    const result = await telegramService.validateBotToken(botToken)

    if (result.valid) {
      return {
        valid: true,
        bot: {
          id: result.bot.id,
          username: result.bot.username,
          firstName: result.bot.first_name
        }
      }
    } else {
      throw createError({ statusCode: 400, message: result.error || 'Invalid bot token' })
    }
  } catch (error: any) {
    logger.error('Token validation error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Failed to validate token' })
  }
})
