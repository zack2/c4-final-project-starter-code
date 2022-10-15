import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils';
import { createLogger } from '../../utils/logger'

const logger = createLogger("createTodo");
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
      logger.info("## CREATE TODO ##")

      try {
          const newTodo: CreateTodoRequest = JSON.parse(event.body)
          const user = getUserId(event);
          const todo = await createTodo(newTodo,user)

          logger.info("## CREATE TODO SUCCESSFULLY ##")
          return {
              statusCode: 201,
              body: JSON.stringify({
                  "item": todo
              })
          }
      } catch (error) {
          logger.error("## CREATE TODO FAILED ##", { error: error.message })
          return {
              statusCode: 500,
              body: JSON.stringify({
                  "message": "System errors"
              })
          }
      }
  }

)

handler.use(
  cors({
    credentials: true
  })
)
