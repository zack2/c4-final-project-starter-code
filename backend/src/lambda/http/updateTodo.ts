import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { updateTodo } from '../../businessLogic/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger("updateTodo")

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
      logger.info("## UPDATE TODO ##")
      try {
          const todoId = event.pathParameters.todoId
          const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

          // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
          const user = getUserId(event);
          await updateTodo(todoId,user, updatedTodo);
          logger.info("## UPDATE TODO SUCCESSFULLY ##");
          return {
              statusCode: 201,
              body: JSON.stringify({
                  "item": "Todo had been update!"
              })
          }
      } catch (error) {
          logger.error("## UPDATE TODO FAILED ##", { error: error.message })
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

