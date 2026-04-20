import { createUploadthing, type FileRouter } from 'uploadthing/server'

const f = createUploadthing()

export const ourFileRouter = {
  avatarUploader: f({ image: { maxFileSize: '2MB' } }).onUploadComplete(({ file }) => {
    console.log('Avatar upload complete:', file.ufsUrl)
  }),
  productImageUploader: f({ image: { maxFileSize: '4MB' } }).onUploadComplete(({ file }) => {
    console.log('Product image upload complete:', file.ufsUrl)
  }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
