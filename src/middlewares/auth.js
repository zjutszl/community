import jwt from 'jwt-simple';
import config from '../config';
import * as db from '../data/db';
import User from '../data/models/user';
import Message from '../data/models/message';
import role from '../data/role';

export const adminRequired = (req, res, next) => {
  if (!req.user) {
    let err = new Error('需要登录');
    err.status = 401;
    next(err);
    return;
  }

  if (!req.user.isAdmin()) {
    let err = new Error('需要管理员权限');
    err.status = 403;
    next(err);
    return;
  }

  next();
};

export const supportRequired = (req, res, next) => {
  if (!req.user) {
    let err = new Error('需要登录');
    err.status = 401;
    next(err);
    return;
  }

  if (!req.user.isSupport && !req.user.isAdmin()) {
    let err = new Error('需要运营权限权限');
    err.status = 403;
    next(err);
    return;
  }

  next();
};

export const userRequired = (req, res, next) => {
  if (!req.user) {
    let err = new Error('需要登录');
    err.status = 401;
    next(err);
    return;
  }

  next();
};

export const authUser = async (req, res, next) => {
  res.locals.currentUser = null;

  const token =
    req.headers['x-access-token'] ||
    req.signedCookies[config.authCookieName] ||
    '';

  if (token) {
    try {
      const decoded = jwt.decode(token, config.jwtSecret);
      if (decoded.exp <= Date.now()) {
        res.end('Access token has expired', 400);
        return;
      }

      const count = await db.count(Message)(
        { masterId: decoded._id, hasRead: false },
        {}
      );

      decoded.isAdmin = function () {
        return this.role === role.Admin
      }

      decoded.isSupport = function () {
        return this.role === role.Support
      }

      res.locals.count = count;
      req.user = res.locals.currentUser = decoded;
      next();
    } catch (err) {
      next();
    }
  } else {
    next();
  }
};
