import { Book, BookMutationResponse, Maybe, Resolvers } from '../../types/graphql'
import { pubsub } from '../../server'
import { addBook, deleteBookById, getAllBooks, getBookById } from '../dataSources/bookDataSource'
import { BOOK_ADDED } from './booksSubscriptions'

export const booksQueries: Partial<Resolvers> = {
	Query: {
		books: async () => await getAllBooks(),
		book: async (_: any, args: { bookId: string }) => await getBookById(args.bookId)
	}
}

export const booksMutations: Partial<Resolvers> = {
	Mutation: {
		createBook: async (_: any, args: { bookToAdd: Book }) => {
			const duplicatedBook: Maybe<Book> = await getBookById(args.bookToAdd.id)
			if (duplicatedBook) {
				return {
					success: false,
					message: `ID is already exists, id: ${duplicatedBook.id}`,
					books: await getAllBooks(),
					book: duplicatedBook
				} as BookMutationResponse
			}

			await addBook(args.bookToAdd)

			pubsub.publish(BOOK_ADDED, { bookAdded: args });

			return {
				success: true,
				message: 'book was successfully added',
				books: await getAllBooks(),
				book: args.bookToAdd
			} as BookMutationResponse
		},
		updateBook: async (_: any, args: { bookToUpdate: Book }) => {
			const bookInList: Maybe<Book> = await getBookById(args.bookToUpdate.id)

			if (bookInList) {
				Object.assign(bookInList, args.bookToUpdate)

				return {
					success: true,
					message: 'Book was updated successfully.',
					books: await getAllBooks(),
					book: bookInList
				} as BookMutationResponse
			} else {
				return {
					success: false,
					message: 'Book does not exists',
					books: await getAllBooks()
				} as BookMutationResponse
			}
		},
		deleteBook: async (_: any, args: { bookIdToDelete: string }) => {
			const bookToDelete: Maybe<Book> = await getBookById(args.bookIdToDelete)

			if (bookToDelete) {
				await deleteBookById(args.bookIdToDelete)

				return {
					success: true,
					message: 'Book was deleted successfully.',
					books: await getAllBooks()
				}
			} else {
				return {
					success: false,
					message: 'Book Id was not found',
					books: await getAllBooks()
				}
			}
		}
	}
}
