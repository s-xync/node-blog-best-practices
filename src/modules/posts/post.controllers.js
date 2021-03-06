import HttpStatus from "http-status-codes";

import Post from "./post.model";
import User from "../users/user.model";

export async function createPost(req, res) {
  try {
    const post = await Post.createPost(req.body, req.user._id);
    return res.status(HttpStatus.CREATED).json(post);
  } catch (e) {
    return res.status(HttpStatus.BAD_REQUEST).json(e);
  }
}

export async function getPostById(req, res) {
  try {
    // populate will populate the user field with real user object
    const post = await Post.findById(req.params.id).populate("user");
    return res.status(HttpStatus.OK).json(post);
  } catch (e) {
    return res.status(HttpStatus.BAD_REQUEST).json(e);
  }
}

export async function getPostsList(req, res) {
  const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
  const skip = req.query.skip ? parseInt(req.query.skip) : undefined;
  try {
    const posts = await Post.list({
      limit,
      skip
    });
    return res.status(HttpStatus.OK).json(posts);
  } catch (e) {
    return res.status(HttpStatus.BAD_REQUEST).json(e);
  }
}

export async function updatePost(req, res) {
  try {
    const post = await Post.findById(req.params.id);

    if (!post.user.equals(req.user._id)) {
      // same user must be able to update the post
      return res.sendStatus(HttpStatus.UNAUTHORIZED);
    }

    Object.keys(req.body).forEach(key => {
      post[key] = req.body[key];
    });

    const updatedPost = await post.save();

    return res.status(HttpStatus.OK).json(updatedPost);
  } catch (e) {
    return res.status(HttpStatus.BAD_REQUEST).json(e);
  }
}

export async function deletePost(req, res) {
  try {
    const post = await Post.findById(req.params.id);

    if (!post.user.equals(req.user._id)) {
      return res.sendStatus(HttpStatus.UNAUTHORIZED);
    }

    await post.remove();
    return res.sendStatus(HttpStatus.OK);
  } catch (e) {
    return res.status(HttpStatus.BAD_REQUEST).json(e);
  }
}

export async function favoritePost(req, res) {
  try {
    const user = await User.findById(req.user._id);
    await user._favorites.posts(req.params.id);
    return res.sendStatus(HttpStatus.OK);
  } catch (e) {
    return res.status(HttpStatus.BAD_REQUEST).json(e);
  }
}

export async function getAuthorizedPostById(req, res) {
  try {
    // populate will populate the user field with real user object
    const promises = await Promise.all([
      User.findById(req.user._id),
      Post.findById(req.params.id).populate("user")
    ]);

    const favorite = promises[0]._favorites.isPostIsFavorite(req.params.id);
    const post = promises[1];

    return res.status(HttpStatus.OK).json({
      ...post.toJSON(),
      favorite
    });
  } catch (e) {
    return res.status(HttpStatus.BAD_REQUEST).json(e);
  }
}

export async function getAuthorizedPostsList(req, res) {
  const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
  const skip = req.query.skip ? parseInt(req.query.skip) : undefined;
  try {
    const promises = await Promise.all([
      User.findById(req.user._id),
      Post.list({
        limit,
        skip
      })
    ]);
    // initial array is empty and then it traverses every time with new post to get updated
    const posts = promises[1].reduce((arr, post) => {
      const favorite = promises[0]._favorites.isPostIsFavorite(post._id);
      arr.push({
        ...post.toJSON(),
        favorite
      });
      return arr;
    }, []);

    return res.status(HttpStatus.OK).json(posts);
  } catch (e) {
    return res.status(HttpStatus.BAD_REQUEST).json(e);
  }
}
