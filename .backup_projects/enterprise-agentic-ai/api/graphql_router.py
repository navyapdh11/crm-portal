import strawberry
from fastapi import APIRouter
from strawberry.fastapi import GraphQLRouter

@strawberry.type
class Query:
    @strawberry.field
    def status(self) -> str:
        return "GraphQL API Operational"

schema = strawberry.Schema(query=Query)
graphql_router = GraphQLRouter(schema)
