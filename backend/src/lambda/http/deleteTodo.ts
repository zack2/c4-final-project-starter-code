import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { deleteTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger("deleteTodo");

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
      logger.info("## DELETE TODO ##");
      try {
          const todoId = event.pathParameters.todoId

          // TODO: Remove a TODO item by id
          const user = getUserId(event);
          await deleteTodo(todoId,user);

          return {
              statusCode: 201,
              body: JSON.stringify({
                  "message": "Todo had been deleted!"
              })
          }
      } catch (error) {
          logger.error('## DELETE TODO FAILED: ', { error: error.message });
          return {
              statusCode: 500,
              body: JSON.stringify({
                  "message": "System errors"
              })
          }
      }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
