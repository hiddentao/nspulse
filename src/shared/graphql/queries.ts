import { gql } from "graphql-tag"
import {
  EVENT_STATS_FIELDS,
  NOTIFICATIONS_RESPONSE_FIELDS,
  USER_PROFILE_FIELDS,
  VALIDATE_TOKEN_RESULT_FIELDS,
} from "./fragments"

export const ME = gql`
  query Me {
    me {
      ...UserProfileFields
    }
  }
  ${USER_PROFILE_FIELDS}
`

export const GET_MY_NOTIFICATIONS = gql`
  query GetMyNotifications($pageParam: PageParam!) {
    getMyNotifications(pageParam: $pageParam) {
      ...NotificationsResponseFields
    }
  }
  ${NOTIFICATIONS_RESPONSE_FIELDS}
`

export const GET_MY_UNREAD_NOTIFICATIONS_COUNT = gql`
  query GetMyUnreadNotificationsCount {
    getMyUnreadNotificationsCount
  }
`

export const VALIDATE_TOKEN = gql`
  query ValidateToken {
    validateToken {
      ...ValidateTokenResultFields
    }
  }
  ${VALIDATE_TOKEN_RESULT_FIELDS}
`

export const GET_EVENT_STATS = gql`
  query GetEventStats {
    getEventStats {
      ...EventStatsFields
    }
  }
  ${EVENT_STATS_FIELDS}
`
