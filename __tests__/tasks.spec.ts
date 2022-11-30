import { addMocksToSchema } from '@graphql-tools/mock'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { List } from '@libs/model'
import { ApolloServer, gql } from 'apollo-server'
import { Context } from 'vm'
import { createMockContext, MockContext } from '../libs/context'
import { typeDefs } from '../services/tasks/resolvers/schema'
import { resolvers } from '../__mocks__/services/tasks/resolvers'

let testSever: ApolloServer
let mockCtx: MockContext
let ctx: Context

const listQuery = gql`
  query List {
    lists {
      id
      title
      tasks {
        id
        position
        title
        status
      }
    }
  }
`
const pagedListQuery = gql`
  query PagedListQuery($skip: Int!, $take: Int) {
    pagedLists(skip: $skip, take: $take) {
      id
      title
      tasks {
        id
        position
        title
        status
      }
    }
  }
`
const createListMutation = gql`
  mutation CreateList($createListInput: CreateListInput!) {
    createList(input: $createListInput) {
      id
      title
    }
  }
`
const createTaskMutation = gql`
  mutation CreateTask($listId: ID!, $createTaskInput: CreateTaskInput!) {
    createTask(listId: $listId, input: $createTaskInput) {
      title
      id
      status
    }
  }
`
const updateTaskMutation = gql`
  mutation UpdateTask($updateTaskId: ID!, $updateTaskInput: UpdateTaskInput!) {
    updateTask(id: $updateTaskId, input: $updateTaskInput) {
      id
      status
      title
    }
  }
`
const MoveTaskMutation = gql`
  mutation MoveTask($moveTaskId: ID!, $moveTaskInput: MoveTaskInput!) {
    moveTask(id: $moveTaskId, input: $moveTaskInput) {
      status
      position
    }
  }
`

beforeAll(() => {
  mockCtx = createMockContext()
  ctx = mockCtx as any as Context

  testSever = new ApolloServer({
    schema: addMocksToSchema({
      schema: makeExecutableSchema({ typeDefs, resolvers }),
      preserveResolvers: true,
    }),
    context: mockCtx,
  })
})

describe('Testing Task and List Queries', () => {
  it('fetches all the lists', async () => {
    const response = await testSever.executeOperation({ query: listQuery })
    checkResponse(response)
    expect(response).toMatchSnapshot()
  })
  it('fetches first 2 list', async () => {
    const response = await testSever.executeOperation({
      query: pagedListQuery,
      variables: {
        skip: 0,
        take: 2,
      },
    })
    checkResponse(response)
    expect(response).toMatchSnapshot()
  })
})

describe('Testing Task and List Mutations', () => {
  it('create list', async () => {
    const list: List = {
      id: '1',
      title: 'List 1',
    }
    const response = await testSever.executeOperation({
      query: createListMutation,
      variables: {
        createListInput: {
          title: list.title,
        },
      },
    })
    checkResponse(response)
    await expect(createList(list, ctx)).resolves.toEqual(list)
  })
  it('create task', async () => {})
  it('update task', async () => {})
  it('move task', async () => {})
})

const checkResponse = (response: any) => {
  expect(response).toBeTruthy()
  expect(response).toHaveProperty('data')
  expect(response.errors).toBeFalsy()
}

const createList = async (list: List, ctx: Context) => {
  return await ctx.prisma.list.create({
    data: list,
  })
}
