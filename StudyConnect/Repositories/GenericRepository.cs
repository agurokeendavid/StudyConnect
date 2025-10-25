using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using StudyConnect.Data;
using StudyConnect.Repositories.Contracts;

namespace StudyConnect.Repositories;

public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    protected readonly AppDbContext _ctx;
    protected readonly DbSet<T> _db;

    public GenericRepository(AppDbContext ctx)
    {
        _ctx = ctx;
        _db = ctx.Set<T>();
    }

    public async Task AddAsync(T entity) => await _db.AddAsync(entity);
    public void Delete(T entity) => _db.Remove(entity);

    public async Task<IEnumerable<T>> GetAllAsync(Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null, string includeProperties = "")
    {
        IQueryable<T> query = _db;
        if (filter != null) query = query.Where(filter);
        foreach (var include in includeProperties.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
            query = query.Include(include.Trim());
        return orderBy != null ? await orderBy(query).ToListAsync() : await query.ToListAsync();
    }

    public async Task<T?> GetByIdAsync(object id) => await _db.FindAsync(id);
    public Task<int> SaveAsync() => _ctx.SaveChangesAsync();
    public void Update(T entity) => _db.Update(entity);
    public IQueryable<T> Query() => _db.AsQueryable();
}