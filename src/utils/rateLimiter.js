const redisClient = require("../config/redis")

async function isRateLimited(userId, limit =3, windowSec=20) {
    const key = `rate_limit:msg:${userId}`;

    const current = await redisClient.incr(key);
    if( current === 1){
        await redisClient.expire(key, windowSec);
    }    
    return current > limit;
}

module.exports = {isRateLimited};