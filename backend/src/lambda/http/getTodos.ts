import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors,  httpErrorHandler } from 'middy/middlewares'

import { getTodosForUser as getTodosForUser } from '../../businessLogic/todos'
import { getUserId } from '../utils';
import { createLogger } from '../../utils/logger'

const logger  = createLogger("getTodos");

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
      logger.info("## GET TODOS ##")

      try {
          const userId = getUserId(event)
          const todos = await getTodosForUser(userId);


          return {
              statusCode: 200,
              body: JSON.stringify({
                  "items": todos
              })
          };
      } catch (error) {
          logger.error('## GET TODO FAILED: ', { error: error.message })

          return {
              statusCode: 500,
              body: JSON.stringify({
                  "message": "System errors"
              })
          }
      }
  });


handler
    .use(httpErrorHandler())
    .use(
        cors({
            credentials: true
        })
    )
